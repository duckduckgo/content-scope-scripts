/**
 * @module Duck Player Page
 * @category Special Pages
 *
 * @description
 *
 * DuckPlayer Page can be embedded into special contexts. It will currently look for a video ID in the
 * following order of precedence.
 *
 * Assuming the video ID is `123`:
 *
 * - 1) `duck://player?videoID=123`
 * - 2) `duck://player/123`
 * - 3) `https://youtube-nocookie.com/embed/123`
 *
 * ### Integration
 *
 * #### Assets/HTML
 *
 * - macOS: use `pages/duckplayer/index.html`, everything is inlined into that single file
 * - windows: load the folder of assets under `pages/duckplayer`
 *
 * #### Messages:
 *
 * On Page Load
 *   - {@link DuckPlayerPageMessages.onUserValuesChanged} begins immediately. It expects an initial value, and then will continue to listen for updates
 *
 * Then the following message can be sent at any time
 *   - {@link DuckPlayerPageMessages.setUserValues}
 *
 * Please see {@link DuckPlayerPageMessages} for the up-to-date list
 */
import {
    Messaging,
    WindowsMessagingConfig,
    MessagingContext, TestTransportConfig
} from '../../../../../messaging/index.js'
import { DuckPlayerPageMessages, UserValues } from './messages'

// for docs
export { DuckPlayerPageMessages, UserValues }

const VideoPlayer = {
    /**
     * Returns the video player iframe
     * @returns {HTMLIFrameElement}
     */
    iframe: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLIFrameElement'.
        return document.querySelector('#player')
    },

    /**
     * Returns the iframe player container
     * @returns {HTMLElement}
     */
    playerContainer: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.player-container')
    },

    /**
     * Returns the full YouTube embed URL to be used for the player iframe
     * @param {string} videoId
     * @param {number|boolean} timestamp
     * @returns {string}
     */
    videoEmbedURL: (videoId, timestamp) => {
        const url = new URL(`/embed/${videoId}`, 'https://www.youtube-nocookie.com')

        url.searchParams.set('iv_load_policy', '1') // show video annotations
        url.searchParams.set('autoplay', '1') // autoplays the video as soon as it loads
        url.searchParams.set('rel', '0') // shows related videos from the same channel as the video
        url.searchParams.set('modestbranding', '1') // disables showing the YouTube logo in the video control bar

        if (timestamp) {
            url.searchParams.set('start', String(timestamp)) // if timestamp supplied, start video at specific point
        }

        return url.href
    },
    /**
     * Sets up the video player:
     * 1. Fetches the video id
     * 2. If the video id is correctly formatted, it loads the YouTube video in the iframe, otherwise displays an error message
     */
    init: () => {
        VideoPlayer.loadVideoById()
        VideoPlayer.setTabTitle()
    },

    /**
     * Tries loading the video if there's a valid video id, otherwise shows error message.
     */
    loadVideoById: () => {
        const validVideoId = Comms.getValidVideoId()
        const timestamp = Comms.getSanitizedTimestamp()

        if (validVideoId) {
            VideoPlayer.iframe().setAttribute('src', VideoPlayer.videoEmbedURL(validVideoId, timestamp))
        } else {
            VideoPlayer.showVideoError('Invalid video id')
        }
    },

    /**
     * Show an error instead of the video player iframe
     */
    showVideoError: (errorMessage) => {
        VideoPlayer.playerContainer().innerHTML = '<div class="player-error"><b>ERROR:</b> <span class="player-error-message"></span></div>'

        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        document.querySelector('.player-error-message').textContent = errorMessage
    },

    /**
     * Trigger callback when the video player iframe has loaded
     * @param {() => void} callback
     */
    onIframeLoaded: (callback) => {
        const iframe = VideoPlayer.iframe()

        if (iframe) {
            iframe.addEventListener('load', callback)
        }
    },

    /**
     * Fires whenever the video player iframe <title> changes (the video doesn't have the <title> set to
     * the video title until after the video has loaded...)
     * @param {Function} callback(title)
     */
    onIframeTitleChange: (callback) => {
        const iframe = VideoPlayer.iframe()

        if (iframe?.contentWindow && iframe?.contentDocument) {
            const title = iframe.contentDocument.querySelector('title')

            if (title) {
                // @ts-expect-error - typescript known about MutationObserver in this context
                const observer = new iframe.contentWindow.MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        callback(mutation.target.textContent)
                    })
                })
                observer.observe(title, { childList: true })
            } else {
                // console.warn('could not access title in iframe')
            }
        } else {
            // console.warn('could not access iframe?.contentWindow && iframe?.contentDocument')
        }
    },

    /**
     * Get the video title from the video iframe.
     * @returns {string|false}
     */
    getValidVideoTitle: (iframeTitle) => {
        if (iframeTitle) {
            if (iframeTitle === 'YouTube') {
                return false
            }

            return iframeTitle.replace(/ - YouTube$/g, '')
        }

        return false
    },

    /**
     * Sets the tab title to the title of the video once the video title has loaded.
     */
    setTabTitle: () => {
        // Only set the title once, no subsequent sets are allowed once a valid title has been found.
        let hasGottenValidVideoTitle = false

        VideoPlayer.onIframeLoaded(() => {
            VideoPlayer.onIframeTitleChange((title) => {
                if (!hasGottenValidVideoTitle) {
                    const validTitle = VideoPlayer.getValidVideoTitle(title)

                    if (validTitle) {
                        document.title = 'Duck Player - ' + validTitle
                        hasGottenValidVideoTitle = true
                    }
                }
            })
        })
    }
}

const Comms = {
    /** @type {DuckPlayerPageMessages | undefined} */
    messaging: undefined,
    /**
     * NATIVE NOTE: Gets the video id from the location object, works for MacOS < > 12
     */
    getVideoIdFromLocation: () => {
        /**
         * In MacOS < 12, the video id is the entire 'pathname' (duck://player/123 <- /123 is the 'pathname')
         * In MacOS 12+, the video id is what's after "/embed/" in 'pathname' because of the
         * top level being youtube-nocookie.com/embed/123?... <- /embed/123 is the 'pathname'
         */
        const url = new URL(window.location.href)
        const params = Object.fromEntries(url.searchParams)
        if (typeof params.videoID === 'string') {
            return params.videoID
        }
        if (window.location.protocol === 'duck:') {
            return window.location.pathname.substr(1)
        } else {
            return window.location.pathname.replace('/embed/', '')
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
            return input
        }
        return false
    },

    /**
     * Returns a sanitized video id if there is a valid one.
     * @returns {(string|false)}
     */
    getValidVideoId: () => {
        return Comms.validateVideoId(Comms.getVideoIdFromLocation())
    },

    /**
     * Gets the video id
     * @returns {number|boolean}
     */
    getSanitizedTimestamp: () => {
        if (window.location && window.location.search) {
            const parameters = new URLSearchParams(window.location.search)
            const timeParameter = parameters.get('t')

            if (timeParameter) {
                return Comms.getTimestampInSeconds(timeParameter)
            }

            return false
        }
        return false
    },

    /**
     * Sanitizes and converts timestamp to an integer of seconds,
     * input may be in the format 1h30m20s (each unit optional)
     * (iframe only takes seconds as parameter...)
     * todo(Shane): unit tests for this!
     * @param {string} timestamp
     * @returns {(number|false)}
     */
    getTimestampInSeconds: (timestamp) => {
        const units = {
            h: 3600,
            m: 60,
            s: 1
        }

        const parts = timestamp.split(/(\d+[hms]?)/)

        const totalSeconds = parts.reduce((total, part) => {
            if (!part) return total

            for (const unit in units) {
                if (part.includes(unit)) {
                    return total + (parseInt(part) * units[unit])
                }
            }

            return total
        }, 0)

        if (totalSeconds > 0) {
            return totalSeconds
        }

        return false
    },

    /**
     * Based on e, returns whether the received message is valid.
     * @param {any} e
     * @returns {boolean}
     */
    isValidMessage: (e, message) => {
        if (import.meta.env === 'development') {
            console.warn('Allowing all messages because we are in development mode')
            return true
        }
        if (import.meta.platform === 'windows') {
            // todo(Shane): Verify this message
            console.log('WINDOWS: allowing message', e)
            return true
        }
        const hasMessage = e && e.data && typeof e.data[message] !== 'undefined'
        const isValidMessage = hasMessage && (e.data[message] === true || e.data[message] === false)

        // todo(Shane): Verify this is ok on macOS
        const hasCorrectOrigin = e.origin && (e.origin === 'https://www.youtube-nocookie.com' || e.origin === 'duck://player')

        if (isValidMessage && hasCorrectOrigin) {
            return true
        }

        return false
    },

    /**
     * Starts listening for 'alwaysOpenSetting' coming from native, and if we receive it
     * update the 'Setting' to the value of the message (true || false)
     *
     * To mock, use:
     *
     * `window.postMessage({ alwaysOpenSetting: false })`
     */
    init: () => {
        const messageContext = new MessagingContext({
            context: 'specialPages',
            featureName: 'duckPlayerPage',
            env: import.meta.env
        })
        if (import.meta.platform === 'windows') {
            const opts = new WindowsMessagingConfig({
                methods: {
                    // @ts-expect-error - not in @types/chrome
                    postMessage: window.chrome.webview.postMessage,
                    // @ts-expect-error - not in @types/chrome
                    addEventListener: window.chrome.webview.addEventListener,
                    // @ts-expect-error - not in @types/chrome
                    removeEventListener: window.chrome.webview.removeEventListener
                }
            })
            const messaging = new Messaging(messageContext, opts)
            Comms.messaging = new DuckPlayerPageMessages(messaging)
        } else if (import.meta.platform === 'integration') {
            const config = new TestTransportConfig({
                notify (msg) {
                    console.log(msg)
                },
                request: (msg) => {
                    console.log(msg)
                    if (msg.method === 'getUserValues') {
                        return Promise.resolve(new UserValues({
                            overlayInteracted: false,
                            privatePlayerMode: { alwaysAsk: {} }
                        }))
                    }
                    return Promise.resolve(null)
                },
                subscribe (msg) {
                    console.log(msg)
                    return () => {
                        console.log('teardown')
                    }
                }
            })
            const messaging = new Messaging(messageContext, config)
            Comms.messaging = new DuckPlayerPageMessages(messaging)
        }
        if (!Comms.messaging) {
            console.warn('Cannot establish communications')
            return
        }
        // eslint-disable-next-line promise/prefer-await-to-then
        Comms.messaging.getUserValues().then((value) => {
            if ('enabled' in value.privatePlayerMode) {
                Setting.setState(true)
            } else {
                Setting.setState(false)
            }
        })
        Comms.messaging?.onUserValuesChanged(value => {
            if ('enabled' in value.privatePlayerMode) {
                Setting.setState(true)
            } else {
                Setting.setState(false)
            }
        })
    },
    /**
     * From the player page, all we can do is 'setUserValues' to {enabled: {}}
     */
    setAlwaysOpen () {
        Comms.messaging?.setUserValues({
            overlayInteracted: false,
            privatePlayerMode: { enabled: {} }
        })
    }
}

const Setting = {
    /**
     * Returns the checkbox
     * @returns {HTMLInputElement}
     */
    settingsIcon: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('[aria-label="Open Settings"]')
    },
    /**
     * Returns the checkbox
     * @returns {HTMLInputElement}
     */
    checkbox: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('#setting')
    },

    /**
     * Returns the settings label
     * @returns {HTMLElement}
     */
    container: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.setting-container')
    },

    /**
     * Set the value of the checkbox
     * 1. Set the actual 'checked' property of the checkbox
     * 2. Update the toggle with the correct classes
     * @param {boolean} value
     */
    set: (value) => {
        Setting.checkbox().checked = value
    },

    /**
     * Returns whether checkbox isChecked
     * @returns {boolean}
     */
    isChecked: () => {
        return Setting.checkbox().checked
    },

    /**
     * Sets the state of the setting immediately
     * @param {boolean} value
     */
    setState: (value) => {
        Setting.toggleAnimatable(false)
        Setting.toggleVisibility(!value)
        Setting.set(value)
    },

    /**
     * Update the checkbox value and send the new setting value to native
     * @param {boolean} checked
     */
    updateAndSend: (checked) => {
        if (checked) {
            setTimeout(() => {
                if (Setting.isChecked()) {
                    Setting.toggleAnimatable(true)
                    Setting.toggleVisibility(false)
                    Setting.higlightSettingsButton()

                    // NATIVE NOTE: Setting is sent to native after animation is done
                    // this is because as soon as native receives the updated setting
                    // it also sends out a message to all opened PPPs to set the
                    // setting instantly. We don't want to do that for _this_ window, this
                    // is the quickest way of fixing that issue.
                    setTimeout(() => {
                        Comms.setAlwaysOpen()
                    }, 300) // Should match slide in CSS time
                }
            }, 800) // Wait a bit to allow for user mis-clicks
        }
    },

    /**
     * Toggle visibility of the entire settings container
     * @param {boolean} visible
     */
    toggleVisibility: (visible) => {
        Setting.container()?.classList?.toggle('invisible', !visible)
    },

    /**
     * Toggles whether the settings container should be animatable. It should only be so in anticipation
     * of user action (clicking the checkbox)
     * @param {boolean} animatable
     */
    toggleAnimatable: (animatable) => {
        Setting.container()?.classList?.toggle('animatable', animatable)
    },

    /**
     * A nice touch to slightly highlight the settings button while the
     * settings container is animating/sliding in behind it.
     */
    higlightSettingsButton: () => {
        // @ts-expect-error - Object is possibly 'null'.
        const openSettingsClasses = document.querySelector('.open-settings').classList

        openSettingsClasses.add('active')

        setTimeout(() => {
            openSettingsClasses.remove('active')
        }, 300 + 100) // match .animatable css
    },

    /**
     * Initializes the setting checkbox:
     * 1. Listens for (user) changes on the actual checkbox
     * 2. Listens for to clicks on the checkbox text
     */
    init: () => {
        const checkbox = Setting.checkbox()

        checkbox.addEventListener('change', () => {
            Setting.updateAndSend(checkbox.checked)
        })

        const settingsIcon = Setting.settingsIcon()

        // windows settings - we will need to alter for other platforms.
        settingsIcon.setAttribute('href', 'duck://settings/duckplayer')
    }
}

const PlayOnYouTube = {
    /**
     * Returns the YouTube button
     * @returns {HTMLElement}
     */
    button: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.play-on-youtube')
    },

    /**
     * Returns the full YouTube source URL for a video, based on video id
     * @param {string} videoId
     * @param {number|boolean} timestamp
     * @returns {string}
     */
    getVideoLinkURL: (videoId, timestamp) => {
        const url = new URL('/watch', 'https://www.youtube.com')

        url.searchParams.set('v', videoId)

        if (timestamp) {
            url.searchParams.set('t', timestamp + 's')
        }

        return url.href
    },

    /**
     * If there is a valid video id, set the 'href' of the YouTube button to the
     * video link url
     */
    init: () => {
        const validVideoId = Comms.getValidVideoId()
        const timestamp = Comms.getSanitizedTimestamp()

        if (validVideoId) {
            PlayOnYouTube.button().setAttribute('href', PlayOnYouTube.getVideoLinkURL(validVideoId, timestamp))
        }
    }
}

const Tooltip = {
    visible: false,

    /**
     * Returns the (i)-icon
     * @returns {HTMLElement}
     */
    icon: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.info-icon')
    },

    /**
     * Returns the tooltip
     * @returns {HTMLElement}
     */
    tooltip: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.info-icon-tooltip')
    },

    /**
     * Toggles visibility of tooltip
     * @param {boolean} show
     */
    toggle: (show) => {
        Tooltip.tooltip()?.classList?.toggle('above', Tooltip.isCloseToBottom())
        Tooltip.tooltip()?.classList?.toggle('visible', show)
        Tooltip.visible = show
    },

    /**
     * Returns whether tooltip is too close to bottom, used for positioning it above
     * the icon when this happens
     * @returns {boolean}
     */
    isCloseToBottom: () => {
        const icon = Tooltip.icon()
        const rect = icon && icon.getBoundingClientRect()

        if (!rect || !rect.top) {
            return false
        }

        const iconTop = rect.top + window.scrollY
        const spaceBelowIcon = window.innerHeight - iconTop

        if (spaceBelowIcon < 125) {
            return true
        }

        return false
    },

    /**
     * Sets up the tooltip to show/hide based on icon hover
     */
    init: () => {
        Tooltip.icon().addEventListener('mouseenter', () => {
            Tooltip.toggle(true)
        })

        Tooltip.icon().addEventListener('mouseleave', () => {
            Tooltip.toggle(false)
        })
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
        document.addEventListener('mousemove', MouseMove.handleFadeState)

        // Don't count clicks as inactivity and reset the timer.
        document.addEventListener('mousedown', MouseMove.handleFadeState)

        // Start watching for inactivity as soon as page is loaded - there might not be any
        // mouse interactions etc
        MouseMove.handleFadeState()

        MouseMove.contentHover().addEventListener('mouseenter', () => {
            MouseMove.isHoveringContent = true
        })

        MouseMove.contentHover().addEventListener('mouseleave', () => {
            MouseMove.isHoveringContent = false
        })
    },

    /**
     * Watch for inactivity and toggle toolbar accordingly
     */
    handleFadeState: (e) => {
        if (MouseMove.timer) {
            clearTimeout(MouseMove.timer)
        }

        if (MouseMove.isFaded) {
            MouseMove.fadeInContent()
        }

        // @ts-expect-error - Type 'Timeout' is not assignable to type 'null'.
        MouseMove.timer = setTimeout(() => {
            // Only fade out if user is not hovering content or tooltip is shown
            if (!MouseMove.isHoveringContent && !Tooltip.visible) {
                MouseMove.fadeOutContent()
            }
        }, MouseMove.limit)
    },

    /**
     * Return the background element
     * @returns {HTMLElement}
     */
    bg: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.bg')
    },

    /**
     * Returns all content hover container, used for detecting
     * hovers on the video player
     * @returns {HTMLElement}
     */
    contentHover: () => {
        // @ts-expect-error - Type 'HTMLElement | null' is not assignable to type 'HTMLElement'.
        return document.querySelector('.content-hover')
    },

    /**
     * Fades out content
     */
    fadeOutContent: () => {
        MouseMove.updateContent(true)
    },

    /**
     * Fades in content
     */
    fadeInContent: () => {
        MouseMove.updateContent(false)
    },

    /**
     * Updates the faded state of the content below the player
     */
    updateContent: (isFaded) => {
        document.body?.classList?.toggle('faded', isFaded)

        setTimeout(() => {
            MouseMove.isFaded = isFaded
        }, MouseMove.fadeTransitionTime)
    }
}

/**
 * Initializes all parts of the page on load.
 */
document.addEventListener('DOMContentLoaded', () => {
    Setting.init()
    Comms.init()
    VideoPlayer.init()
    Tooltip.init()
    PlayOnYouTube.init()
    MouseMove.init()
})
