// Plays the native app's part in a PIR opt-out: sends each action to the page in the frame, waits for its
// response, performs `navigate` actions itself and re-sends the pending action when the frame navigates.

const SITE_PAGES = {
    '/optouts': 'sites/people-search/optouts.html',
};
const USER_PROFILE = { firstName: 'John', lastName: 'Smith', age: '52', addresses: [{ city: 'Chicago', state: 'IL' }] };

const params = new URLSearchParams(location.search);
// The integration build reads these from the top URL: load only broker protection, then wait for `content-scope-init-args`.
params.set('load-features', 'brokerProtection');
params.set('wait-for-init-args', '');
history.replaceState(null, '', `?${params}`);
const settings = {
    visualize: params.get('visualize') !== 'off',
    pauseMs: Number(params.get('pauseMs') ?? 1500),
};

const frame = /** @type {HTMLIFrameElement} */ (document.querySelector('iframe'));
const list = /** @type {HTMLOListElement} */ (document.getElementById('actions'));
const statusText = /** @type {HTMLElement} */ (document.getElementById('status'));
const runButton = /** @type {HTMLButtonElement} */ (document.getElementById('run'));
const { actions } = await fetch('sites/people-search/opt-out.json').then((response) => response.json());

/** @type {{ action: Record<string, any>, resolve: (result: Record<string, any>) => void } | null} */
let pending = null;
/** @type {((params: unknown) => void) | null} */
let deliver = null;
/** @type {Promise<void>} */
let frameReady = new Promise(() => {});
let run = 0;

setUpSettingsForm();
renderActions();
frame.addEventListener('load', () => {
    if (frame.contentWindow?.location.href === 'about:blank') return;
    frameReady = attachAndResend();
});
runButton.addEventListener('click', () => runOptOut());

async function runOptOut() {
    const thisRun = ++run;
    pending = null;
    renderActions();
    setStatus('Running');
    for (const [index, action] of actions.entries()) {
        if (thisRun !== run) return;
        setActionState(index, 'running');
        if (action.actionType === 'navigate') {
            frame.src = SITE_PAGES[new URL(action.url).pathname];
            await waitForFrameLoad();
            setActionState(index, 'done');
            continue;
        }
        if (action.actionType === 'emailConfirmation') {
            setActionState(index, 'skipped', 'Native only; the fake sends no email.');
            break;
        }
        await sleep(settings.pauseMs);
        const result = await send(action);
        if (thisRun !== run) return;
        if ('error' in result) {
            setActionState(index, 'failed', result.error.message);
            setStatus('Failed', 'failed');
            return;
        }
        setActionState(index, 'done');
    }
    setStatus('Opt-out submitted');
}

/**
 * @param {Record<string, any>} action
 * @returns {Promise<Record<string, any>>}
 */
async function send(action) {
    await frameReady;
    return new Promise((resolve) => {
        pending = { action, resolve };
        deliver?.({ state: { action, data: { userProfile: USER_PROFILE } } });
    });
}

// The pending action's page is gone, so send it again to the new one, as native does.
async function attachAndResend() {
    await attach();
    if (pending) deliver?.({ state: { action: pending.action, data: { userProfile: USER_PROFILE } } });
}

async function attach() {
    const win = /** @type {Window & typeof globalThis & { cssMessaging: { impl: unknown } }} */ (frame.contentWindow);
    const doc = win.document;
    deliver = null;
    await new Promise((resolve, reject) => {
        const script = doc.createElement('script');
        script.src = '/build/contentScope.js';
        script.onload = resolve;
        script.onerror = reject;
        doc.head.append(script);
    });
    win.cssMessaging.impl = {
        notify(/** @type {{ method: string, params: any }} */ message) {
            if (message.method === 'userTurnNeeded') onUserTurnNeeded();
            if (message.method === 'actionCompleted' && pending && resultActionID(message.params.result) === pending.action.id) {
                const { resolve } = pending;
                pending = null;
                resolve(message.params.result);
            }
        },
        request: () => Promise.resolve(null),
        subscribe(/** @type {{ subscriptionName: string }} */ subscription, /** @type {(params: unknown) => void} */ callback) {
            if (subscription.subscriptionName === 'onActionReceived') deliver = callback;
            return () => {};
        },
    };
    const initialized = new Promise((resolve) => doc.addEventListener('content-scope-init-completed', resolve, { once: true }));
    doc.dispatchEvent(
        new win.CustomEvent('content-scope-init-args', {
            detail: {
                platform: { name: 'macos' },
                site: { enabledFeatures: ['brokerProtection'] },
                featureSettings: { brokerProtection: { visualizeActions: settings.visualize ? 'enabled' : 'disabled' } },
            },
        }),
    );
    await initialized;
}

function onUserTurnNeeded() {
    const index = actions.findIndex((/** @type {{ id: string }} */ action) => action.id === pending?.action.id);
    setActionState(index, 'turn');
    setStatus('Your turn: complete the highlighted step in the page', 'turn');
}

/**
 * @param {Record<string, any>} result
 */
function resultActionID(result) {
    return (result.success ?? result.error)?.actionID;
}

async function waitForFrameLoad() {
    await new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
    await frameReady;
}

/**
 * @param {number} ms
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderActions() {
    list.replaceChildren(
        ...actions.map((/** @type {Record<string, any>} */ action) => {
            const item = document.createElement('li');
            item.dataset.state = 'pending';
            const step = document.createElement('span');
            step.className = 'step';
            step.textContent = action.step ?? '';
            item.append(step, action.actionType);
            return item;
        }),
    );
}

/**
 * @param {number} index
 * @param {'running' | 'turn' | 'done' | 'failed' | 'skipped'} state
 * @param {string} [detail]
 */
function setActionState(index, state, detail) {
    const item = list.children[index];
    if (!(item instanceof HTMLElement)) return;
    item.dataset.state = state;
    item.querySelector('.detail')?.remove();
    if (detail) {
        const text = document.createElement('span');
        text.className = 'detail';
        text.textContent = detail;
        item.append(text);
    }
    if (state === 'running' || state === 'done') setStatus('Running');
}

/**
 * @param {string} text
 * @param {string} [className]
 */
function setStatus(text, className = '') {
    statusText.textContent = text;
    statusText.className = className;
}

function setUpSettingsForm() {
    const form = /** @type {HTMLFormElement} */ (document.getElementById('settings'));
    const field = (/** @type {string} */ name) => /** @type {HTMLInputElement} */ (form.elements.namedItem(name));
    field('visualize').checked = settings.visualize;
    field('turnstile').checked = params.get('turnstile') === 'manual';
    field('hcaptcha').checked = params.get('hcaptcha') !== 'auto';
    field('pauseMs').value = String(settings.pauseMs);
    form.addEventListener('change', () => {
        params.set('visualize', field('visualize').checked ? 'on' : 'off');
        params.set('turnstile', field('turnstile').checked ? 'manual' : 'auto');
        params.set('hcaptcha', field('hcaptcha').checked ? 'manual' : 'auto');
        params.set('pauseMs', field('pauseMs').value);
        location.search = `?${params}`;
    });
}
