import { overrideProperty, defineProperty, getFeatureAttr, DDGProxy, DDGReflect } from '../utils'
const featureName = 'fingerprinting-screen-size'

function setWindowScreenPropertyValue (property, value) {
    // Here we don't update the prototype getter because the values are updated dynamically
    try {
        defineProperty(window.screen, property, {
            get: () => value,
            set: () => {},
            configurable: true
        })
    } catch (e) {}
}

function setWindowDimensions () {
    try {
        setWindowScreenPropertyValue('availWidth', window.innerWidth)
        setWindowScreenPropertyValue('availHeight', window.innerHeight)
        setWindowScreenPropertyValue('width', window.innerWidth)
        setWindowScreenPropertyValue('height', window.innerHeight)
    } catch (e) {}
}

/**
 * Since we're spoofing that the browser window is in the upper left corner
 * of the screen (i.e., 0,0), we should map any offsets provided to window.open() back
 * into the *real* screen coordinates. From the websites point of view, the browser's inner window
 * is the user's screen. Without this correction, any pop-ups set using relative dimensions will
 * be in the wrong position and possibly on the wrong monitor (if the user has multiple monitors).
 */
export function correctWindowOpenOffset (windowFeatures, offsetName, realScreenOffset) {
    const dimensionRegex = new RegExp(`\\b${offsetName}\\s*=\\s*(?<offset>-?\\d+(\\.\\d+)?)\\b`, 'i')
    const matches = windowFeatures.match(dimensionRegex)

    if (matches && matches.groups && matches.groups.offset) {
        const newOffset = Number(matches.groups.offset) + realScreenOffset
        windowFeatures = windowFeatures.replace(
            dimensionRegex,
            `${offsetName}=${newOffset}`
        )
    }
    return windowFeatures
}

export function init (args) {
    // Storing the original getters for screenX and screenY allow us to
    // query the real screen offsets after overwriting. This is needed to
    // accurately position window.open pop-ups based on the real window
    // location (which may change during a page visit).
    const origPropDesc = {}
    try {
        origPropDesc.screenX = Object.getOwnPropertyDescriptor(window, 'screenX').get
        origPropDesc.screenY = Object.getOwnPropertyDescriptor(window, 'screenY').get
    } catch (e) {}

    // Always return that the window is in the upper left of the display
    overrideProperty('screenX', {
        object: window,
        origValue: window.screenX,
        targetValue: 0
    })
    overrideProperty('screenY', {
        object: window,
        origValue: window.screenY,
        targetValue: 0
    })
    overrideProperty('screenLeft', {
        object: window,
        origValue: window.screenLeft,
        targetValue: 0
    })
    overrideProperty('screenTop', {
        object: window,
        origValue: window.screenTop,
        targetValue: 0
    })
    overrideProperty('availTop', {
        object: Screen.prototype,
        origValue: screen.availTop,
        targetValue: 0
    })
    overrideProperty('availLeft', {
        object: Screen.prototype,
        origValue: screen.availLeft,
        targetValue: 0
    })
    if (Object.prototype.hasOwnProperty.call(Screen.prototype, 'left')) { // Firefox only
        overrideProperty('left', {
            object: Screen.prototype,
            origValue: screen.left,
            targetValue: 0
        })
    }
    if (Object.prototype.hasOwnProperty.call(Screen.prototype, 'top')) { // Firefox only
        overrideProperty('top', {
            object: Screen.prototype,
            origValue: screen.top,
            targetValue: 0
        })
    }
    if (Object.prototype.hasOwnProperty.call(window, 'mozInnerScreenX')) { // Firefox only
        overrideProperty('mozInnerScreenX', {
            object: window,
            origValue: window.mozInnerScreenX,
            targetValue: 0
        })
    }
    if (Object.prototype.hasOwnProperty.call(window, 'mozInnerScreenY')) { // Firefox only
        overrideProperty('mozInnerScreenY', {
            object: window,
            origValue: window.mozInnerScreenY,
            targetValue: 0
        })
    }

    // Reveal only the size of the current window to content
    // Since innerHeight and innerWidth are dynamic based on window size we need to
    // update these values dynamically. However, it's still important to override
    // the prototypes to prevent a malicious website from being able to discover
    // the true size via `delete window.screen.width`, etc.
    // See: https://palant.info/2020/12/10/how-anti-fingerprinting-extensions-tend-to-make-fingerprinting-easier/
    overrideProperty('availWidth', {
        object: Screen.prototype,
        origValue: screen.availWidth,
        targetValue: window.innerWidth
    })
    overrideProperty('availHeight', {
        object: Screen.prototype,
        origValue: screen.availHeight,
        targetValue: window.innerHeight
    })
    overrideProperty('width', {
        object: Screen.prototype,
        origValue: screen.width,
        targetValue: window.innerWidth
    })
    overrideProperty('height', {
        object: Screen.prototype,
        origValue: screen.height,
        targetValue: window.innerHeight
    })

    overrideProperty('colorDepth', {
        object: Screen.prototype,
        origValue: screen.colorDepth,
        targetValue: getFeatureAttr(featureName, args, 'colorDepth', 24)
    })
    overrideProperty('pixelDepth', {
        object: Screen.prototype,
        origValue: screen.pixelDepth,
        targetValue: getFeatureAttr(featureName, args, 'pixelDepth', 24)
    })

    // Override window.open to allow us to re-position popups based on the
    // real window location.
    const windowOpenProxy = new DDGProxy(window, 'open', {
        apply (target, thisArg, args) {
            if (args.length < 3) {
                return DDGReflect.apply(target, thisArg, args)
            }
            try {
                let windowFeatures = args[2]
                const screenY = origPropDesc.screenY ? origPropDesc.screenY.call(window) : 0
                if (screenY !== 0) {
                    windowFeatures = correctWindowOpenOffset(
                        windowFeatures,
                        'top',
                        screenY
                    )
                    windowFeatures = correctWindowOpenOffset(
                        windowFeatures,
                        'screeny',
                        screenY
                    )
                }
                const screenX = origPropDesc.screenX ? origPropDesc.screenX.call(window) : 0
                if (screenX !== 0) {
                    windowFeatures = correctWindowOpenOffset(
                        windowFeatures,
                        'left',
                        screenX
                    )
                    windowFeatures = correctWindowOpenOffset(
                        windowFeatures,
                        'screenx',
                        screenX
                    )
                }
                args[2] = windowFeatures
            } catch (e) {
                // Ignore all errors
            }
            return DDGReflect.apply(target, thisArg, args)
        }
    })
    windowOpenProxy.overload()

    window.addEventListener('resize', function () {
        setWindowDimensions()
    })
}
