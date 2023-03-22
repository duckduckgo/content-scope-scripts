// @ts-nocheck
const VideoPlayer = {
    /**
     * Returns the video player iframe
     * @returns {HTMLElement}
     */
    iframe: () => {
        return document.querySelector('#player');
    },

    /**
     * Returns the iframe player container
     * @returns {HTMLElement}
     */
    playerContainer: () => {
        return document.querySelector('.player-container');
    },

    /**
     * Returns the full YouTube embed URL to be used for the player iframe
     * @param {string} videoId
     * @returns {string}
     */
    videoEmbedURL: (videoId, timestamp) => {
        const url = new URL(`/embed/${videoId}`, "https://www.youtube-nocookie.com")

        url.searchParams.set('iv_load_policy', '1'); // show video annotations
        url.searchParams.set('autoplay', '1'); // autoplays the video as soon as it loads
        url.searchParams.set('rel', '0'); // shows related videos from the same channel as the video
        url.searchParams.set('modestbranding', '1'); // disables showing the YouTube logo in the video control bar

        if (timestamp) {
            url.searchParams.set('start', timestamp); // if timestamp supplied, start video at specific point
        }

        return url.href;
    },
    /**
     * Sets up the video player:
     * 1. Fetches the video id
     * 2. If the video id is correctly formatted, it loads the YouTube video in the iframe, otherwise displays an error message
     */
    init: () => {
        VideoPlayer.loadVideoById();
        VideoPlayer.setTabTitle();
    },

    /**
     * Tries loading the video if there's a valid video id, otherwise shows error message.
     */
    loadVideoById: () => {
        let validVideoId = Comms.getValidVideoId();
        let timestamp = Comms.getSanitizedTimestamp();

        if (validVideoId) {
            VideoPlayer.iframe().setAttribute('src', VideoPlayer.videoEmbedURL(validVideoId, timestamp));
        } else {
            VideoPlayer.showVideoError('Invalid video id');
        }
    },

    /**
     * Show an error instead of the video player iframe
     */
    showVideoError: (errorMessage) => {
        VideoPlayer.playerContainer().innerHTML = `<div class="player-error"><b>ERROR:</b> <span class="player-error-message"></span></div>`;

        document.querySelector('.player-error-message').textContent = errorMessage;
    },

    /**
     * Trigger callback when the video player iframe has loaded
     * @param {Function} callback
     */
    onIframeLoaded: (callback) => {
        let iframe = VideoPlayer.iframe();

        if (iframe) {
            iframe.addEventListener('load', callback);
        }
    },

    /**
     * Fires whenever the video player iframe <title> changes (the video doesn't have the <title> set to
     * the video title until after the video has loaded...)
     * @param {Function} callback(title)
     */
    onIframeTitleChange: (callback) => {
        let iframe = VideoPlayer.iframe();

        if (iframe?.contentWindow && iframe?.contentDocument) {
            let title = iframe.contentDocument.querySelector('title');

            if (title) {
                let observer = new iframe.contentWindow.MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        callback(mutation.target.textContent);
                    });
                });
                observer.observe(title, { childList: true });
            }
        }
    },

    /**
     * Get the video title from the video iframe.
     * @returns {string|false}
     */
    getValidVideoTitle: (iframeTitle) => {
        if (iframeTitle) {
            if (iframeTitle === 'YouTube') {
                return false;
            }

            return iframeTitle.replace(/ - YouTube$/g,'');
        }

        return false;
    },

    /**
     * Sets the tab title to the title of the video once the video title has loaded.
     */
    setTabTitle: () => {
        // Only set the title once, no subsequent sets are allowed once a valid title has been found.
        let hasGottenValidVideoTitle = false;

        VideoPlayer.onIframeLoaded(() => {
            VideoPlayer.onIframeTitleChange((title) => {
                if (!hasGottenValidVideoTitle) {
                    let validTitle = VideoPlayer.getValidVideoTitle(title);

                    if (validTitle) {
                        document.title = 'Duck Player - ' + validTitle;
                        hasGottenValidVideoTitle = true;
                    }
                }
            });
        });
    }
};

const Comms = {
    /**
     * Sends a message to native
     * NATIVE NOTE: This sends a valid `setting` to native with the value of `value`
     * Currently only used for setting setAlwaysOpenSettingTo:true
     * @param {string} setting - key/name of the setting
     * @param {*} value - value (could be anything) of what to set the setting to.
     */
    sendToNative: (setting, value) => {
        if (!Comms.hasValidMessageContent(setting, value)) {
            console.error('Invalid setting type or value');
            return;
        }

        try {
            window.webkit.messageHandlers[setting].postMessage(value)
        } catch (e) {
            console.error('Unable to send message to native. Tried sending window.webkit.messageHandlers.'+setting+'.postMessage('+value+')\n\n', e);
        }
    },

    /**
     * Only send a message to native if trigger a valid setting with a valid value,
     * currently only valid is setAlwaysOpenSettingTo:true.
     * @param {string} setting
     * @param {*} value
     * @returns {boolean}
     */
    hasValidMessageContent: (setting, value) => {
        let validSettings = {
            'setAlwaysOpenSettingTo': [true]
        };

        if (validSettings[setting]) {
            let validValues = validSettings[setting];

            for (validValue of validValues) {
                if (value === validValue) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * NATIVE NOTE: Gets the video id from the location object, works for MacOS < > 12
     */
    getVideoIdFromLocation: () => {
        /**
         * In MacOS < 12, the video id is the entire 'pathname' (duck://player/123 <- /123 is the 'pathname')
         * In MacOS 12+, the video id is what's after "/embed/" in 'pathname' because of the
         * top level being youtube-nocookie.com/embed/123?... <- /embed/123 is the 'pathname'
         */
        if (window.location.protocol === 'duck:') {
            return window.location.pathname.substr(1);
        } else {
            return window.location.pathname.replace('/embed/', '');
        }
    },

    /**
     * Validates that the input string is a valid video id.
     * If so, returns the video id otherwise returns false.
     * @param {string} input
     * @returns {(string|false)}
     */
    validateVideoId: (input) => {
        if (/^[a-zA-Z0-9-_]+$/g.test(input)) {
            return input;
        }
        return false;
    },

    /**
     * Returns a sanitized video id if there is a valid one.
     * @returns {(string|false)}
     */
    getValidVideoId: () => {
        return Comms.validateVideoId(Comms.getVideoIdFromLocation());
    },

    /**
     * Gets the video id
     */
    getSanitizedTimestamp: () => {
        if (window.location && window.location.search) {
            let parameters = new URLSearchParams(window.location.search);
            let timeParameter = parameters.get('t');

            if (timeParameter) {
                return Comms.getTimestampInSeconds(timeParameter);
            }

            return false;
        }
        return false;
    },

    /**
     * Sanitizes and converts timestamp to an integer of seconds,
     * input may be in the format 1h30m20s (each unit optional)
     * (iframe only takes seconds as parameter...)
     * @param {string} untrusted
     * @returns {(number|false)}
     */
    getTimestampInSeconds: (timestamp) => {
        let units = {
            'h': 3600,
            'm': 60,
            's': 1,
        }

        let parts = timestamp.split(/(\d+[hms]?)/);

        let totalSeconds = parts.reduce((total, part) => {
            if (!part) return total;

            for (unit in units) {
                if (part.includes(unit)) {
                    return total + (parseInt(part) * units[unit]);
                }
            }
        }, 0);

        if (totalSeconds > 0) {
            return totalSeconds;
        }

        return false;
    },

    /**
     * Listens for a 'message' sent from native, and calls the 'callback' with the contents of
     * the 'message'.
     * NATIVE NOTE: Currently used to listen for messages named 'alwaysOpenSetting' which can contain
     * a boolean true|false. This happens when user updates the setting outside of the PPP, or in a different
     * tab.
     * @param {string} message
     * @param {function} callback
     */
    listen: (message, callback) => {
        window.addEventListener('message', (e) => {
            if (Comms.isValidMessage(e, message)) {
                callback(e.data[message]);
            }
        });
    },

    /**
     * Based on e, returns whether the received message is valid.
     * @param {Event} e
     * @returns {boolean}
     */
    isValidMessage: (e, message) => {
        let hasMessage = e && e.data && typeof e.data[message] !== 'undefined',
            isValidMessage = hasMessage && (e.data[message] === true || e.data[message] === false),
            hasCorrectOrigin = e.origin && (e.origin === 'https://www.youtube-nocookie.com' || e.origin === 'duck://player');

        if (isValidMessage && hasCorrectOrigin) {
            return true;
        }

        return false;
    },

    /**
     * Starts listening for 'alwaysOpenSetting' coming from native, and if we receive it
     * update the 'Setting' to the value of the message (true || false)
     *
     * To mock, use:
     * window.postMessage({ alwaysOpenSetting: false })
     */
    init: () => {
        Comms.listen('alwaysOpenSetting', (value) => {
            Setting.setState(value);
        });
    }
};

const Setting = {
    /**
     * Returns the checkbox
     * @returns {HTMLElement}
     */
    checkbox: () => {
        return document.querySelector('#setting');
    },

    /**
     * Returns the settings label
     * @returns {HTMLElement}
     */
    container: () => {
        return document.querySelector('.setting-container');
    },

    /**
     * Set the value of the checkbox
     * 1. Set the actual 'checked' property of the checkbox
     * 2. Update the toggle with the correct classes
     * @param {boolean} value
     */
    set: (value) => {
        Setting.checkbox().checked = value;
    },

    /**
     * Returns whether checkbox isChecked
     * @returns {boolean}
     */
    isChecked: () => {
        return Setting.checkbox().checked;
    },

    /**
     * Sets the state of the setting immediately
     * @param {boolean} value
     */
    setState: (value) => {
        Setting.toggleAnimatable(false);
        Setting.toggleVisibility(!value);
        Setting.set(value);
    },

    /**
     * Update the checkbox value and send the new setting value to native
     * @param {boolean} checked
     */
    updateAndSend: (checked) => {
        if (checked) {
            setTimeout(() => {
                if (Setting.isChecked()) {
                    Setting.toggleAnimatable(true);
                    Setting.toggleVisibility(false);
                    Setting.higlightSettingsButton();

                    // NATIVE NOTE: Setting is sent to native after animation is done
                    // this is because as soon as native receives the updated setting
                    // it also sends out a message to all opened PPPs to set the
                    // setting instantly. We don't want to do that for _this_ window, this
                    // is the quickest way of fixing that issue.
                    setTimeout(() => {
                        Comms.sendToNative('setAlwaysOpenSettingTo', checked);
                    }, 300); // Should match slide in CSS time
                }
            }, 800); // Wait a bit to allow for user mis-clicks
        }
    },

    /**
     * Toggle visibility of the entire settings container
     * @param {boolean} visible
     */
    toggleVisibility: (visible) => {
        Setting.container()?.classList?.toggle('invisible', !visible);
    },

    /**
     * Toggles whether the settings container should be animatable. It should only be so in anticipation
     * of user action (clicking the checkbox)
     * @param {boolean} animatable
     */
    toggleAnimatable: (animatable) => {
        Setting.container()?.classList?.toggle('animatable', animatable);
    },

    /**
     * A nice touch to slightly highlight the settings button while the
     * settings container is animating/sliding in behind it.
     */
    higlightSettingsButton: () => {
        let openSettingsClasses = document.querySelector('.open-settings').classList;

        openSettingsClasses.add('active');

        setTimeout(() => {
            openSettingsClasses.remove('active');
        }, 300 + 100) // match .animatable css

    },

    /**
     * Initializes the setting checkbox:
     * 1. Listens for (user) changes on the actual checkbox
     * 2. Listens for to clicks on the checkbox text
     */
    init: () => {
        let checkbox = Setting.checkbox();

        checkbox.addEventListener('change', () => {
            Setting.updateAndSend(checkbox.checked);
        });
    }
};

const PlayOnYouTube = {
    /**
     * Returns the YouTube button
     * @returns {HTMLElement}
     */
    button: () => {
        return document.querySelector('.play-on-youtube');
    },

    /**
     * Returns the full YouTube source URL for a video, based on video id
     * @param {string} videoId
     * @param {number} timestamp
     * @returns {string}
     */
    getVideoLinkURL: (videoId, timestamp) => {
        const url = new URL('/watch', 'https://www.youtube.com');

        url.searchParams.set('v', videoId);

        if (timestamp) {
            url.searchParams.set('t', timestamp + 's');
        }

        return url.href;
    },

    /**
     * If there is a valid video id, set the 'href' of the YouTube button to the
     * video link url
     */
    init: () => {
        let validVideoId = Comms.getValidVideoId();
        let timestamp = Comms.getSanitizedTimestamp();

        if (validVideoId) {
            PlayOnYouTube.button().setAttribute('href', PlayOnYouTube.getVideoLinkURL(validVideoId, timestamp));
        }
    }
};

const Tooltip = {
    visible: false,

    /**
     * Returns the (i)-icon
     * @returns {HTMLElement}
     */
    icon: () => {
        return document.querySelector('.info-icon');
    },

    /**
     * Returns the tooltip
     * @returns {HTMLElement}
     */
    tooltip: () => {
        return document.querySelector('.info-icon-tooltip');
    },

    /**
     * Toggles visibility of tooltip
     * @param {boolean} show
     */
    toggle: (show) => {
        Tooltip.tooltip()?.classList?.toggle('above', Tooltip.isCloseToBottom());
        Tooltip.tooltip()?.classList?.toggle('visible', show);
        Tooltip.visible = show;
    },

    /**
     * Returns whether tooltip is too close too bottom, used for positioning it above
     * the icon when this happens
     * @returns {boolean}
     */
    isCloseToBottom: () => {
        let icon = Tooltip.icon()
        let rect = icon && icon.getBoundingClientRect();

        if (!rect || !rect.top) {
            return false;
        }

        let iconTop = rect.top + window.scrollY;
        let spaceBelowIcon = window.innerHeight - iconTop;

        if (spaceBelowIcon < 125) {
            return true;
        }
    },

    /**
     * Sets up the tooltip to show/hide based on icon hover
     */
    init: () => {
        Tooltip.icon().addEventListener('mouseenter', () => {
            Tooltip.toggle(true);
        });

        Tooltip.icon().addEventListener('mouseleave', () => {
            Tooltip.toggle(false);
        });
    }
}

const MouseMove = {
    /**
     * How long to wait (inactivity) before fading out the content below the player
     */
    limit: 1500,

    /**
     * Transition time - needs to match toolbar value in CSS.
     */
    fadeTransitionTime: 500,

    /**
     * Internal, used for timeout and state.
     */
    timer: null,
    isFaded: false,
    isHoveringContent: false,

    /**
     * Fade out content below player in case there is mouse inactivity
     * after the MouseMove.limit
     */
    init: () => {
        document.addEventListener('mousemove', MouseMove.handleFadeState);

        // Don't count clicks as inactivity and reset the timer.
        document.addEventListener('mousedown', MouseMove.handleFadeState);

        // Start watching for inactivity as soon as page is loaded - there might not be any
        // mouse interactions etc
        MouseMove.handleFadeState();

        MouseMove.contentHover().addEventListener('mouseenter', () => {
            MouseMove.isHoveringContent = true;
        });

        MouseMove.contentHover().addEventListener('mouseleave', () => {
            MouseMove.isHoveringContent = false;
        });
    },

    /**
     * Watch for inactivity and toggle toolbar accordingly
     */
    handleFadeState: (e) => {
        if (MouseMove.timer) {
            clearTimeout(MouseMove.timer);
        }

        if (MouseMove.isFaded) {
            MouseMove.fadeInContent();
        }

        MouseMove.timer = setTimeout(() => {
            // Only fade out if user is not hovering content or tooltip is shown
            if (!MouseMove.isHoveringContent && !Tooltip.visible) {
                MouseMove.fadeOutContent();
            }
        }, MouseMove.limit);
    },

    /**
     * Return the background element
     * @returns {HTMLElement}
     */
    bg: () => {
        return document.querySelector('.bg');
    },

    /**
     * Returns all content hover container, used for detecting
     * hovers on the video player
     * @returns {HTMLElement}
     */
    contentHover: () => {
        return document.querySelector('.content-hover');
    },

    /**
     * Fades out content
     */
    fadeOutContent: () => {
        MouseMove.updateContent(true);
    },

    /**
     * Fades in content
     */
    fadeInContent: () => {
        MouseMove.updateContent(false);
    },

    /**
     * Updates the faded state of the content below the player
     */
    updateContent: (isFaded) => {
        document.body?.classList?.toggle('faded', isFaded);

        setTimeout(() => {
            MouseMove.isFaded = isFaded;
        }, MouseMove.fadeTransitionTime);
    },
};

/**
 * Initializes all parts of the page on load.
 */
document.addEventListener('DOMContentLoaded', () => {
    Setting.init();
    Comms.init();
    VideoPlayer.init();
    Tooltip.init();
    PlayOnYouTube.init();
    MouseMove.init();
});

