/**
 * @module Duck Player buffering hold
 *
 * The wait behind the poster + spinner overlay: watch the player for its first frame,
 * give up if none arrives, and decide when a tap may dismiss. Knows nothing about pixels,
 * config or custom elements: the caller supplies the timings and receives the outcome.
 */

/** @typedef {'frame' | 'error' | 'gave_up' | 'tap' | 'tap_after_give_up' | 'torn_down'} HoldRemovalReason */

/** Non-bubbling media events, so they are observed on the container in the capture phase */
const MEDIA_EVENTS = ['playing', 'timeupdate', 'error'];

/**
 * @param {object} options
 * @param {Element} options.container - the player container the <video> lives in
 * @param {HTMLVideoElement} options.video
 * @param {{ showSpinner(): void, hideSpinner(): void, remove(): void,
 *           addEventListener: Element['addEventListener'] }} options.overlay
 * @param {{ spinnerDelayMs: number, giveUpMs: number }} options.timings
 * @param {(reason: HoldRemovalReason, elapsedMs: number) => void} options.onReport
 * @param {() => void} options.onStopped
 * @param {() => number} [options.now]
 * @returns {{ stop: (reason: Exclude<HoldRemovalReason, 'gave_up'>) => void }}
 */
export function holdUntilFirstFrame({ container, video, overlay, timings, onReport, onStopped, now = () => performance.now() }) {
    const startedAt = now();
    let stopped = false;
    let gaveUp = false;
    let tapCount = 0;

    const spinnerTimer = setTimeout(() => overlay.showSpinner(), timings.spinnerDelayMs);

    // Player-level failures ("Video unavailable") never reach the media element, so only this timer ends a hopeless wait
    const giveUpTimer = setTimeout(() => {
        gaveUp = true;
        overlay.hideSpinner();
        // report here rather than only at removal: a hold nobody taps would otherwise report on navigation alone
        onReport('gave_up', now() - startedAt);
    }, timings.giveUpMs);

    /** @param {Event} e */
    const onMediaEvent = (e) => {
        const el = e.target;
        // an <img> failing inside the player also reaches us in the capture phase
        if (!(el instanceof HTMLVideoElement)) return;
        if (e.type === 'error') return stop('error');
        if (el.currentTime > 0 && !el.paused) stop('frame');
    };

    /** @param {Exclude<HoldRemovalReason, 'gave_up'>} reason */
    const stop = (reason) => {
        if (stopped) return;
        stopped = true;
        clearTimeout(spinnerTimer);
        clearTimeout(giveUpTimer);
        for (const type of MEDIA_EVENTS) {
            container.removeEventListener(type, onMediaEvent, { capture: true });
        }
        overlay.remove();
        onReport(reason, now() - startedAt);
        onStopped();
    };

    // Watching the container rather than the element survives YouTube swapping the <video> mid-startup
    for (const type of MEDIA_EVENTS) {
        container.addEventListener(type, onMediaEvent, { capture: true });
    }

    if (typeof video.requestVideoFrameCallback === 'function') {
        // a swapped-out element is detached, so it cannot be the one presenting a frame
        video.requestVideoFrameCallback(() => {
            if (video.isConnected) stop('frame');
        });
    }

    // YouTube treats a tap on the video surface as its own gesture
    overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

    overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        tapCount += 1;
        // swallow the first tap: dismissing while a frame is still coming reveals the black frame the hold covers
        // the second tap *ever* dismisses, deliberately not a double-tap window, so the escape stays findable minutes later
        if (gaveUp) stop('tap_after_give_up');
        else if (tapCount >= 2) stop('tap');
    });

    return { stop };
}
