/**
 * Windows "Set as Default" (SAD) Settings Page
 *
 * Displayed inside the DuckDuckGo Windows browser when prompting the user to
 * set DuckDuckGo as their default browser through Windows Settings.
 *
 * Flow:
 * 1. The DDG Windows browser maximizes its window to full screen
 * 2. The browser navigates to this page
 * 3. The browser opens and positions the native Windows Settings app on top
 *    of this page, aligned over the empty placeholder area in the center
 * 4. This page shows a dimmed overlay, an instruction bar at the top, and a
 *    hand-drawn arrow pointing toward the "Set default" button in Settings
 *
 * The Settings window is NOT rendered by this page — the DDG browser overlays
 * the real native Windows Settings app on top of this page.
 *
 * @module Set as Default Page
 */

import { createTypedMessages } from '@duckduckgo/messaging';
import { Environment } from '../../../shared/environment.js';
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging.js';
import { init } from '../app/index.js';

export class SetAsDefaultPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging) {
        this.messaging = createTypedMessages(this, messaging);
    }

    /**
     * @returns {Promise<import('../types/set-as-default.ts').InitialSetupResponse>}
     */
    initialSetup() {
        return this.messaging.request('initialSetup');
    }

    /**
     * @param {{message: string}} params
     */
    reportPageException(params) {
        this.messaging.notify('reportPageException', params);
    }

    /**
     * @param {{message: string}} params
     */
    reportInitException(params) {
        this.messaging.notify('reportInitException', params);
    }
}

const baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv(import.meta.env);

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: /** @type {string} */ (import.meta.pageName),
});

const page = new SetAsDefaultPage(messaging);

init(page, baseEnvironment).catch((e) => {
    console.error(e);
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error';
    page.reportInitException({ message: msg });
});
