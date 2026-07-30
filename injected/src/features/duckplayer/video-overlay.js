/* eslint-disable promise/prefer-await-to-then */
/**
 * @module Duck Player Video Overlay
 *
 * ## Decision flow for appending the Video Overlays
 *
 * We'll try to append the full video overlay (or small Dax icon) onto the main video player
 * if the following conditions are met:
 *
 * 1. User has Duck Player configured to 'always ask' (the default)
 * 2. `videoOverlays` is enabled in the remote config
 *
 * If those are both met, the following steps occur on *first page load*:
 *
 * - let `href` be the current `window.location.href` value
 * - *exit to polling step* if `href` is not a valid watchPage
 * - when `href` is a valid watch page, then:
 *   - append CSS to the HEAD to avoid the main player showing
 *   - in a loop (every 100ms), continuously check if the video element has appeared
 * - when the video is showing:
 *   - if the user has duck player set to 'enabled', then:
 *     - show the small dax overlay
 * - if the user has duck player set to 'always ask', then:
 *   - if there's a one-time override (eg: from the serp), then exit to polling
 *   - if the user previously clicked 'watch here + remember', just add the small dax
 *   - otherwise, stop the video playing + append our overlay
 */
import { SideEffects, VideoParams, appendImageAsBackground } from './util.js';
import { DDGVideoOverlay } from './components/ddg-video-overlay.js';
import { OpenInDuckPlayerMsg, Pixel } from './overlay-messages.js';
import { IconOverlay } from './icon-overlay.js';
import { mobileStrings } from './text.js';
import { DDGVideoOverlayMobile } from './components/ddg-video-overlay-mobile.js';
import { DDGVideoThumbnailOverlay } from './components/ddg-video-thumbnail-overlay-mobile.js';
import { DDGVideoDrawerMobile } from './components/ddg-video-drawer-mobile.js';

/** Grace period before the buffering spinner joins the poster (fallback for bufferingFeedback.spinnerDelayMs) */
const DEFAULT_SPINNER_DELAY_MS = 500;
/** When a still-frameless video is treated as never arriving (fallback for bufferingFeedback.giveUpMs) */
const DEFAULT_SPINNER_GIVE_UP_MS = 25000;
const VIDEO_SWAP_POLL_MS = 500;

/**
 * Bucket a hold's lifetime for the removal pixel: enough to see the median and the tail
 * without carrying a per-session timing fingerprint.
 * @param {number} ms
 * @returns {string}
 */
function bucketHoldDuration(ms) {
    const seconds = ms / 1000;
    if (seconds < 1) return '0-1';
    if (seconds < 3) return '1-3';
    if (seconds < 10) return '3-10';
    if (seconds < 20) return '10-20';
    if (seconds < 30) return '20-30';
    return '30+';
}

const HOLD_SIDE_EFFECT = 'holding poster + spinner until first video frame';
const FULLSCREEN_SIDE_EFFECT = 'leaving fullscreen while an overlay is showing';

/** Every mobile overlay that covers the player, for presence checks */
const OVERLAY_TAG_NAMES = [
    DDGVideoOverlayMobile.CUSTOM_TAG_NAME,
    DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME,
    DDGVideoDrawerMobile.CUSTOM_TAG_NAME,
].join(', ');

/**
 * Handle the switch between small & large overlays
 * + conduct any communications
 */
export class VideoOverlay {
    sideEffects = new SideEffects();

    /** @type {string | null} */
    lastVideoId = null;

    /** @type {boolean} */
    didAllowFirstVideo = false;

    /** Which mobile overlay was last appended, so the buffering hold can gate on what actually showed rather than on config @type {'classic' | 'drawer' | null} */
    appendedMobileVariant = null;

    /**
     * @param {object} options
     * @param {import("../duck-player.js").UserValues} options.userValues
     * @param {import("../duck-player.js").OverlaysFeatureSettings} options.settings
     * @param {import("./environment.js").Environment} options.environment
     * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} options.messages
     * @param {import("../duck-player.js").UISettings} options.ui
     */
    constructor({ userValues, settings, environment, messages, ui }) {
        this.userValues = userValues;
        this.settings = settings;
        this.environment = environment;
        this.messages = messages;
        this.ui = ui;
    }

    /**
     * @param {'page-load' | 'preferences-changed' | 'href-changed'} trigger
     */
    init(trigger) {
        if (trigger === 'page-load') {
            this.handleFirstPageLoad();
        } else if (trigger === 'preferences-changed') {
            this.watchForVideoBeingAdded({ via: 'user notification', ignoreCache: true });
        } else if (trigger === 'href-changed') {
            this.watchForVideoBeingAdded({ via: 'href changed' });
        }
    }

    /**
     * Special handling of a first-page, an attempt to load our overlay as quickly as possible
     */
    handleFirstPageLoad() {
        // don't continue unless we're in 'alwaysAsk' mode
        if ('disabled' in this.userValues.privatePlayerMode) return;

        // don't continue if we can't derive valid video params
        const validParams = VideoParams.forWatchPage(this.environment.getPlayerPageHref());
        if (!validParams) return;

        /**
         * If we get here, we know the following:
         *
         * 1) we're going to show the overlay because of user settings/state
         * 2) we're on a valid `/watch` page
         * 3) we have at _least_ a valid video id
         *
         * So, in that case we append some css quickly to the head to ensure player items are not showing
         * Later, when our overlay loads that CSS will be removed in the cleanup.
         */
        this.sideEffects.add('add css to head', () => {
            const style = document.createElement('style');
            style.innerText = this.settings.selectors.videoElementContainer + ' { opacity: 0!important }';
            if (document.head) {
                document.head.appendChild(style);
            }
            return () => {
                if (style.isConnected) {
                    document.head.removeChild(style);
                }
            };
        });

        /**
         * Keep trying to find the video element every 100 ms
         */
        this.sideEffects.add('wait for first video element', () => {
            const int = setInterval(() => {
                this.watchForVideoBeingAdded({ via: 'first page load' });
            }, 100);
            return () => {
                clearInterval(int);
            };
        });
    }

    /**
     * @param {import("./util").VideoParams} params
     */
    addSmallDaxOverlay(params) {
        const containerElement = document.querySelector(this.settings.selectors.videoElementContainer);
        if (!containerElement || !(containerElement instanceof HTMLElement)) {
            console.error('no container element');
            return;
        }
        this.sideEffects.add('adding small dax 🐥 icon overlay', () => {
            const href = params.toPrivatePlayerUrl();

            const icon = new IconOverlay();

            icon.appendSmallVideoOverlay(containerElement, href, (href) => {
                this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href }));
            });

            return () => {
                icon.destroy();
            };
        });
    }

    /**
     * @param {{ignoreCache?: boolean, via?: string}} [opts]
     */
    watchForVideoBeingAdded(opts = {}) {
        const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref());

        if (!params) {
            /**
             * If we've shown a video before, but now we don't have a valid ID,
             * it's likely a 'back' navigation by the user, so we should always try to remove all overlays
             */
            if (this.lastVideoId) {
                this.destroy();
                this.lastVideoId = null;
            }
            return;
        }

        const conditions = [
            // cache overridden
            opts.ignoreCache,
            // first visit
            !this.lastVideoId,
            // new video id
            this.lastVideoId && this.lastVideoId !== params.id, // different
        ];

        if (conditions.some(Boolean)) {
            /**
             * Don't continue until we've been able to find the HTML elements that we inject into
             */
            const videoElement = document.querySelector(this.settings.selectors.videoElement);
            const targetElement = document.querySelector(this.settings.selectors.videoElementContainer);

            if (!videoElement || !targetElement) {
                return null;
            }

            /**
             * If we get here, it's a valid situation
             */
            const userValues = this.userValues;
            this.lastVideoId = params.id;

            /**
             * always remove everything first, to prevent any lingering state
             */
            this.destroy();

            /**
             * When enabled, just show the small dax icon
             */
            if ('enabled' in userValues.privatePlayerMode) {
                return this.addSmallDaxOverlay(params);
            }

            if ('alwaysAsk' in userValues.privatePlayerMode) {
                // if there's a one-time-override (eg: a link from the serp), then do nothing
                if (this.environment.hasOneTimeOverride()) return;

                // should the first video be allowed to play?
                if (this.ui.allowFirstVideo === true && !this.didAllowFirstVideo) {
                    this.didAllowFirstVideo = true;
                    return console.count('Allowing the first video');
                }

                // if the user previously clicked 'watch here + remember', just add the small dax
                if (this.userValues.overlayInteracted) {
                    return this.addSmallDaxOverlay(params);
                }

                // if we get here, we're trying to prevent the video playing
                this.stopVideoFromPlaying();

                if (this.environment.layout === 'mobile') {
                    if (this.shouldShowDrawerVariant()) {
                        const drawerTargetElement = document.querySelector(/** @type {string} */ (this.settings.selectors.drawerContainer));
                        if (drawerTargetElement) {
                            return this.appendMobileDrawer(targetElement, drawerTargetElement, params);
                        }
                    }

                    return this.appendMobileOverlay(targetElement, params);
                }

                return this.appendDesktopOverlay(targetElement, params);
            }
        }
    }

    shouldShowDrawerVariant() {
        return this.settings.videoDrawer?.state === 'enabled' && this.settings.selectors.drawerContainer;
    }

    /**
     * Gates the buffering hold and the fullscreen exit that keeps it reachable: both ship together.
     */
    bufferingFeedbackEnabled() {
        return this.settings.bufferingFeedback?.state === 'enabled';
    }

    /**
     * @param {Element} targetElement
     * @param {import("./util").VideoParams} params
     */
    appendMobileOverlay(targetElement, params) {
        this.messages.sendPixel(new Pixel({ name: 'overlay' }));
        this.appendedMobileVariant = 'classic';

        this.sideEffects.add(`appending ${DDGVideoOverlayMobile.CUSTOM_TAG_NAME} to the page`, () => {
            const elem = /** @type {DDGVideoOverlayMobile} */ (document.createElement(DDGVideoOverlayMobile.CUSTOM_TAG_NAME));
            elem.testMode = this.environment.isTestMode();
            elem.text = mobileStrings(this.environment.strings('overlays.json'));
            elem.addEventListener(DDGVideoOverlayMobile.OPEN_INFO, () => this.messages.openInfo());
            elem.addEventListener(DDGVideoOverlayMobile.OPT_OUT, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                return this.mobileOptOut(e.detail.remember).catch(console.error);
            });
            elem.addEventListener(DDGVideoOverlayMobile.OPT_IN, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                return this.mobileOptIn(e.detail.remember, params).catch(console.error);
            });
            targetElement.appendChild(elem);

            return () => {
                document.querySelector(DDGVideoOverlayMobile.CUSTOM_TAG_NAME)?.remove();
            };
        });

        this.keepOverlayOutOfFullscreen();
    }

    /**
     * @param {Element} targetElement
     * @param {Element} drawerTargetElement
     * @param {import("./util").VideoParams} params
     */
    appendMobileDrawer(targetElement, drawerTargetElement, params) {
        this.messages.sendPixel(new Pixel({ name: 'overlay' }));
        this.appendedMobileVariant = 'drawer';

        this.sideEffects.add(
            `appending ${DDGVideoDrawerMobile.CUSTOM_TAG_NAME} and ${DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME} to the page`,
            () => {
                const thumbnailOverlay = /** @type {DDGVideoThumbnailOverlay} */ (
                    document.createElement(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)
                );
                thumbnailOverlay.testMode = this.environment.isTestMode();
                targetElement.appendChild(thumbnailOverlay);

                const drawer = /** @type {DDGVideoDrawerMobile} */ (document.createElement(DDGVideoDrawerMobile.CUSTOM_TAG_NAME));
                drawer.testMode = this.environment.isTestMode();
                drawer.text = mobileStrings(this.environment.strings('overlays.json'));
                drawer.addEventListener(DDGVideoDrawerMobile.OPEN_INFO, () => this.messages.openInfo());
                drawer.addEventListener(DDGVideoDrawerMobile.OPT_OUT, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                    return this.mobileOptOut(e.detail.remember).catch(console.error);
                });
                drawer.addEventListener(DDGVideoDrawerMobile.DISMISS, () => {
                    return this.dismissOverlay();
                });
                drawer.addEventListener(DDGVideoDrawerMobile.THUMBNAIL_CLICK, () => {
                    return this.dismissOverlay();
                });
                drawer.addEventListener(DDGVideoDrawerMobile.OPT_IN, (/** @type {CustomEvent<{remember: boolean}>} */ e) => {
                    return this.mobileOptIn(e.detail.remember, params).catch(console.error);
                });
                drawerTargetElement.appendChild(drawer);

                if (thumbnailOverlay.container) {
                    this.appendThumbnail(thumbnailOverlay.container);
                }

                return () => {
                    document.querySelector(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)?.remove();
                    drawer?.onAnimationEnd(() => {
                        document.querySelector(DDGVideoDrawerMobile.CUSTOM_TAG_NAME)?.remove();
                    });
                };
            },
        );

        this.keepOverlayOutOfFullscreen();
    }

    /**
     * @param {Element} targetElement
     * @param {import("./util").VideoParams} params
     */
    appendDesktopOverlay(targetElement, params) {
        this.messages.sendPixel(new Pixel({ name: 'overlay' }));

        this.sideEffects.add(`appending ${DDGVideoOverlay.CUSTOM_TAG_NAME} to the page`, () => {
            const elem = new DDGVideoOverlay({
                environment: this.environment,
                params,
                ui: this.ui,
                manager: this,
            });
            targetElement.appendChild(elem);

            return () => {
                document.querySelector(DDGVideoOverlay.CUSTOM_TAG_NAME)?.remove();
            };
        });
    }

    /**
     * A scroll gesture on the watch page can put YouTube's player container into
     * fullscreen. Our overlays are `position: absolute; inset: 0` inside
     * `#movie_player`, so they stretch to the whole screen, and YouTube's
     * `#player-control-container` — positioned outside `#movie_player`'s stacking
     * context, so our z-index cannot reach it — then hit-tests above them. That
     * leaves the overlay covering the screen while every tap lands on YouTube,
     * with no browser chrome left to escape to. Leaving fullscreen puts the
     * overlay back in the player box, where it can be used again.
     *
     * Call this after appending, so the initial check can see the overlay.
     */
    keepOverlayOutOfFullscreen() {
        if (!this.bufferingFeedbackEnabled()) return;

        this.sideEffects.add(FULLSCREEN_SIDE_EFFECT, () => {
            const onChange = () => {
                if (!document.fullscreenElement) return;
                // The buffering hold removes itself without tearing down side effects,
                // so check for a live overlay rather than assuming one is still up.
                if (!document.querySelector(OVERLAY_TAG_NAMES)) return;
                Promise.resolve(document.exitFullscreen?.()).catch(() => {});
            };
            document.addEventListener('fullscreenchange', onChange);
            // The overlay can also be appended while already fullscreen, on a
            // same-page navigation to the next video.
            onChange();
            return () => document.removeEventListener('fullscreenchange', onChange);
        });
    }

    /**
     * Just brute-force calling video.pause() for as long as the user is seeing the overlay.
     */
    stopVideoFromPlaying() {
        this.sideEffects.add(`pausing the <video> element with selector '${this.settings.selectors.videoElement}'`, () => {
            /**
             * Set up the interval - keep calling .pause() to prevent
             * the video from playing
             */
            const int = setInterval(() => {
                const video = /** @type {HTMLVideoElement} */ (document.querySelector(this.settings.selectors.videoElement));
                if (video?.isConnected) {
                    video.pause();
                }
            }, 10);

            /**
             * To clean up, we need to stop the interval
             * and then call .play() on the original element, if it's still connected
             */
            return () => {
                clearInterval(int);

                const video = /** @type {HTMLVideoElement} */ (document.querySelector(this.settings.selectors.videoElement));
                if (video?.isConnected) {
                    void video.play();
                }
            };
        });
    }

    /**
     * @param {HTMLElement} overlayElement
     */
    appendThumbnail(overlayElement) {
        const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref());
        if (!params) return;

        const imageUrl = this.environment.getLargeThumbnailSrc(params.id);
        appendImageAsBackground(overlayElement, '.ddg-vpo-bg', imageUrl);
    }

    /**
     * If the checkbox was checked, this action means that we want to 'always'
     * use the private player
     *
     * But, if the checkbox was not checked, then we want to keep the state
     * as 'alwaysAsk'
     *
     * @param {boolean} remember
     * @param {VideoParams} params
     */
    userOptIn(remember, params) {
        /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
        let privatePlayerMode = { alwaysAsk: {} };
        if (remember) {
            this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '1' }));
            privatePlayerMode = { enabled: {} };
        } else {
            this.messages.sendPixel(new Pixel({ name: 'play.use', remember: '0' }));
            // do nothing. The checkbox was off meaning we don't want to save any choice
        }
        const outgoing = {
            overlayInteracted: false,
            privatePlayerMode,
        };
        this.messages
            .setUserValues(outgoing)
            .then(() => {
                if (this.environment.opensVideoOverlayLinksViaMessage) {
                    return this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href: params.toPrivatePlayerUrl() }));
                }
                return this.environment.setHref(params.toPrivatePlayerUrl());
            })
            .catch((e) => console.error('error setting user choice', e));
    }

    /**
     * @param {boolean} remember
     * @param {import("./util").VideoParams} params
     */
    userOptOut(remember, params) {
        /**
         * If the checkbox was checked we send the 'interacted' flag to the backend
         * so that the next video can just see the Dax icon instead of the full overlay
         *
         * But, if the checkbox was **not** checked, then we don't update any backend state
         * and instead we just swap the main overlay for Dax
         */
        if (remember) {
            this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '1' }));
            /** @type {import("../duck-player.js").UserValues['privatePlayerMode']} */
            const privatePlayerMode = { alwaysAsk: {} };
            this.messages
                .setUserValues({
                    privatePlayerMode,
                    overlayInteracted: true,
                })
                .then((values) => {
                    this.userValues = values;
                })
                .then(() => this.watchForVideoBeingAdded({ ignoreCache: true, via: 'userOptOut' }))
                .catch((e) => console.error('could not set userChoice for opt-out', e));
        } else {
            this.messages.sendPixel(new Pixel({ name: 'play.do_not_use', remember: '0' }));
            this.destroy();
            this.addSmallDaxOverlay(params);
        }
    }

    /**
     * @param {boolean} remember
     * @param {import("./util").VideoParams} params
     */
    async mobileOptIn(remember, params) {
        const pixel = remember ? new Pixel({ name: 'play.use', remember: '1' }) : new Pixel({ name: 'play.use', remember: '0' });

        this.messages.sendPixel(pixel);

        /** @type {import("../duck-player.js").UserValues} */
        const outgoing = {
            overlayInteracted: false,
            privatePlayerMode: remember ? { enabled: {} } : { alwaysAsk: {} },
        };

        const result = await this.messages.setUserValues(outgoing);

        if (this.environment.debug) {
            console.log('did receive new values', result);
        }

        return this.messages.openDuckPlayer(new OpenInDuckPlayerMsg({ href: params.toPrivatePlayerUrl() }));
    }

    /**
     * @param {boolean} remember
     */
    async mobileOptOut(remember) {
        const pixel = remember
            ? new Pixel({ name: 'play.do_not_use', remember: '1' })
            : new Pixel({ name: 'play.do_not_use', remember: '0' });

        this.messages.sendPixel(pixel);

        if (!remember) {
            this.destroy();
            this.showBufferingFeedbackUntilFirstFrame();
            return;
        }

        /** @type {import("../duck-player.js").UserValues} */
        const next = {
            privatePlayerMode: { disabled: {} },
            overlayInteracted: false,
        };

        if (this.environment.debug) {
            console.log('sending user values:', next);
        }

        const updatedValues = await this.messages.setUserValues(next);

        // this is needed to ensure any future page navigations respect the new settings
        this.userValues = updatedValues;

        if (this.environment.debug) {
            console.log('user values response:', updatedValues);
        }

        // No buffering hold here, unlike the remember:false path above. Persisting the
        // choice makes the native layer echo onUserValuesChanged back to this tab, which
        // rebuilds the overlay controller and would tear a freshly-installed hold down
        // mid-startup. Covering this path needs the hold to outlive that rebuild.
        this.destroy();
    }

    /**
     * After opt-out the <video> can take many seconds to present its first frame, and
     * YouTube paints nothing over the black player while it waits. Cover the player with
     * the video's poster and a YouTube-style spinner until the first frame lands.
     *
     * The hold waits for as long as a frame is still plausibly coming rather than
     * expiring on a fixed timer: the wait is dominated by the held ad request, so any
     * timer short enough to help would fire in exactly the cases where the poster is
     * still needed. giveUpMs only stops the spinner from claiming forever.
     *
     * Opt-in via remote config, following the videoDrawer gating pattern, and scoped to
     * the mobile classic overlay; the drawer keeps its own thumbnail while animating out.
     */
    showBufferingFeedbackUntilFirstFrame() {
        if (!this.bufferingFeedbackEnabled()) return;
        if (this.environment.layout !== 'mobile') return;
        // Gate on what was actually appended, not config: the drawer keeps its own
        // thumbnail while it animates out, but a config that asks for the drawer can
        // still fall back to the classic overlay when its container is missing.
        if (this.appendedMobileVariant === 'drawer') return;

        const videoEl = /** @type {HTMLVideoElement | null} */ (document.querySelector(this.settings.selectors.videoElement));
        const targetElement = document.querySelector(this.settings.selectors.videoElementContainer);
        if (!videoEl?.isConnected || !targetElement) return;
        if (document.querySelector(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)) return;

        const sideEffects = this.sideEffects;
        const spinnerDelayMs = this.settings.bufferingFeedback?.spinnerDelayMs ?? DEFAULT_SPINNER_DELAY_MS;
        const giveUpMs = this.settings.bufferingFeedback?.giveUpMs ?? DEFAULT_SPINNER_GIVE_UP_MS;

        sideEffects.add(HOLD_SIDE_EFFECT, () => {
            const overlay = /** @type {DDGVideoThumbnailOverlay} */ (document.createElement(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME));
            overlay.testMode = this.environment.isTestMode();
            targetElement.appendChild(overlay);
            overlay.setPosterCandidates(this.buildPosterCandidates(videoEl));
            overlay.showLoadingState();
            overlay.setLoadingLabel(mobileStrings(this.environment.strings('overlays.json')).bufferingLabel);

            const startedAt = performance.now();
            const messages = this.messages;
            let video = videoEl;
            let removed = false;
            let gaveUp = false;
            let taps = 0;

            /** @param {"frame" | "error" | "gave_up" | "tap" | "tap_after_give_up" | "torn_down"} reason */
            const sendHoldPixel = (reason) => {
                const duration = bucketHoldDuration(performance.now() - startedAt);
                messages.sendPixel(new Pixel({ name: 'buffering.hold_removed', reason, duration }));
            };

            // A video that starts promptly would show the spinner for a couple of
            // frames, so let the poster stand alone for a beat first.
            const spinnerTimer = setTimeout(() => overlay.showSpinner(), spinnerDelayMs);
            // YouTube's player-level failures ("Video unavailable") never reach the
            // media element, so stop claiming progress once a wait is this far gone.
            // Reported here rather than at removal: this is the moment worth counting when
            // tuning giveUpMs, and a hold that is never tapped only reports at the next
            // navigation, where the send is not guaranteed to leave the page.
            const giveUpTimer = setTimeout(() => {
                gaveUp = true;
                overlay.hideSpinner();
                sendHoldPixel('gave_up');
            }, giveUpMs);

            const onProgress = () => {
                if (video.currentTime > 0 && !video.paused) remove('frame');
            };
            const onFrame = () => remove('frame');
            // No frame is coming, and YouTube's error UI is behind our poster
            const onError = () => remove('error');

            /** @type {number | null} */
            let frameCallback = null;
            /** @param {HTMLVideoElement} el */
            const listen = (el) => {
                el.addEventListener('playing', onProgress);
                el.addEventListener('timeupdate', onProgress);
                el.addEventListener('error', onError);
                if (typeof el.requestVideoFrameCallback === 'function') {
                    frameCallback = el.requestVideoFrameCallback(onFrame);
                }
            };
            /** @param {HTMLVideoElement} el */
            const unlisten = (el) => {
                el.removeEventListener('playing', onProgress);
                el.removeEventListener('timeupdate', onProgress);
                el.removeEventListener('error', onError);
                // Otherwise a frame from an element we stopped trusting (a mid-startup
                // swap) can still tear the hold down, which is what the swap poll prevents.
                if (frameCallback !== null && typeof el.cancelVideoFrameCallback === 'function') {
                    el.cancelVideoFrameCallback(frameCallback);
                    frameCallback = null;
                }
            };

            // YouTube can replace the media element mid-startup, stranding the
            // first-frame callback on an element that will never present a frame.
            const swapPoll = setInterval(() => {
                const current = /** @type {HTMLVideoElement | null} */ (document.querySelector(this.settings.selectors.videoElement));
                if (!current || current === video) return;
                unlisten(video);
                video = current;
                listen(video);
            }, VIDEO_SWAP_POLL_MS);

            /** @param {"frame" | "error" | "tap" | "tap_after_give_up" | "torn_down"} reason */
            function remove(reason) {
                if (removed) return;
                removed = true;
                clearTimeout(spinnerTimer);
                clearTimeout(giveUpTimer);
                clearInterval(swapPoll);
                unlisten(video);
                overlay.remove();
                sendHoldPixel(reason);
                // Drop the hold's own registration and its fullscreen guard now, not at
                // the next navigation.
                sideEffects.destroy(FULLSCREEN_SIDE_EFFECT);
                sideEffects.destroy(HOLD_SIDE_EFFECT);
            }

            listen(video);

            // Taps must not reach YouTube's player underneath, which would treat a tap
            // on the video surface as its own gesture.
            for (const type of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
                overlay.addEventListener(type, (e) => e.stopPropagation());
            }
            // A single tap while a frame is still plausibly coming is swallowed:
            // dismissing then would reveal the player's own startup state, the black
            // frame the hold exists to cover. But a second tap insists, and once the
            // wait is hopeless any tap dismisses.
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                taps += 1;
                if (gaveUp) remove('tap_after_give_up');
                else if (taps >= 2) remove('tap');
            });

            return () => remove('torn_down');
        });

        this.keepOverlayOutOfFullscreen();
    }

    /**
     * Poster candidates for the buffering hold, cheapest source first, so the spinner
     * never sits on a black frame. Page-supplied posters are trusted and painted on
     * load; the synthesised i.ytimg.com URLs are marked `verify` so the hold HEAD-checks
     * them, because YouTube answers a missing thumbnail with a placeholder image under a
     * 404 (maxres often 404s, so hqdefault backs it up).
     * @param {HTMLVideoElement} video
     * @returns {{url: string, verify: boolean}[]}
     */
    buildPosterCandidates(video) {
        /** @type {{url: string, verify: boolean}[]} */
        const candidates = [];
        if (video?.poster) candidates.push({ url: video.poster, verify: false });
        const cued = document.querySelector('.ytp-cued-thumbnail-overlay-image, .ytp-cued-thumbnail-overlay');
        if (cued) {
            const match = getComputedStyle(cued).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
            if (match?.[1]) candidates.push({ url: match[1], verify: false });
        }
        const params = VideoParams.forWatchPage(this.environment.getPlayerPageHref());
        if (params) {
            candidates.push({ url: this.environment.getLargeThumbnailSrc(params.id), verify: true });
            candidates.push({ url: new URL(`/vi/${params.id}/hqdefault.jpg`, 'https://i.ytimg.com').href, verify: true });
        }
        return candidates;
    }

    dismissOverlay() {
        const pixel = new Pixel({ name: 'play.do_not_use.dismiss' });
        this.messages.sendPixel(pixel);

        return this.destroy();
    }

    /**
     * Remove elements, event listeners etc
     */
    destroy() {
        this.sideEffects.destroy();
    }
}
