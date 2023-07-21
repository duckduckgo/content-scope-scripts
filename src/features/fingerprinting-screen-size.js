import { defineProperty, wrapProperty } from '../wrapper-utils'
import ContentFeature from '../content-feature'

/**
 * normalize window dimensions, if more than one monitor is in play.
 *  X/Y values are set in the browser based on distance to the main monitor top or left, which
 * can mean second or more monitors have very large or negative values. This function maps a given
 * given coordinate value to the proper place on the main screen.
 */
function normalizeWindowDimension (value, targetDimension) {
    if (value > targetDimension) {
        return value % targetDimension
    }
    if (value < 0) {
        return targetDimension + value
    }
    return value
}

function setWindowPropertyValue (property, value) {
    // Here we don't update the prototype getter because the values are updated dynamically
    try {
        defineProperty(globalThis, property, {
            get: () => value,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            set: () => {},
            configurable: true
        })
    } catch (e) {}
}

const origPropertyValues = {}

/**
 * Fix window dimensions. The extension runs in a different JS context than the
 * page, so we can inject the correct screen values as the window is resized,
 * ensuring that no information is leaked as the dimensions change, but also that the
 * values change correctly for valid use cases.
 */
function setWindowDimensions () {
    try {
        const window = globalThis
        const top = globalThis.top

        const normalizedY = normalizeWindowDimension(window.screenY, window.screen.height)
        const normalizedX = normalizeWindowDimension(window.screenX, window.screen.width)
        if (normalizedY <= origPropertyValues.availTop) {
            setWindowPropertyValue('screenY', 0)
            setWindowPropertyValue('screenTop', 0)
        } else {
            setWindowPropertyValue('screenY', normalizedY)
            setWindowPropertyValue('screenTop', normalizedY)
        }

        // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
        if (top.window.outerHeight >= origPropertyValues.availHeight - 1) {
            // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
            setWindowPropertyValue('outerHeight', top.window.screen.height)
        } else {
            try {
                // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                setWindowPropertyValue('outerHeight', top.window.outerHeight)
            } catch (e) {
                // top not accessible to certain iFrames, so ignore.
            }
        }

        if (normalizedX <= origPropertyValues.availLeft) {
            setWindowPropertyValue('screenX', 0)
            setWindowPropertyValue('screenLeft', 0)
        } else {
            setWindowPropertyValue('screenX', normalizedX)
            setWindowPropertyValue('screenLeft', normalizedX)
        }

        // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
        if (top.window.outerWidth >= origPropertyValues.availWidth - 1) {
            // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
            setWindowPropertyValue('outerWidth', top.window.screen.width)
        } else {
            try {
                // @ts-expect-error -  error TS18047: 'top' is possibly 'null'.
                setWindowPropertyValue('outerWidth', top.window.outerWidth)
            } catch (e) {
                // top not accessible to certain iFrames, so ignore.
            }
        }
    } catch (e) {
        // in a cross domain iFrame, top.window is not accessible.
    }
}

export default class FingerprintingScreenSize extends ContentFeature {
    init () {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        origPropertyValues.availTop = globalThis.screen.availTop
        wrapProperty(globalThis.Screen.prototype, 'availTop', {
            get: () => this.getFeatureAttr('availTop', 0)
        })

        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        origPropertyValues.availLeft = globalThis.screen.availLeft
        wrapProperty(globalThis.Screen.prototype, 'availLeft', {
            get: () => this.getFeatureAttr('availLeft', 0)
        })

        origPropertyValues.availWidth = globalThis.screen.availWidth
        const forcedAvailWidthValue = globalThis.screen.width
        wrapProperty(globalThis.Screen.prototype, 'availWidth', {
            get: () => forcedAvailWidthValue
        })

        origPropertyValues.availHeight = globalThis.screen.availHeight
        const forcedAvailHeightValue = globalThis.screen.height
        wrapProperty(globalThis.Screen.prototype, 'availHeight', {
            get: () => forcedAvailHeightValue
        })

        origPropertyValues.colorDepth = globalThis.screen.colorDepth
        wrapProperty(globalThis.Screen.prototype, 'colorDepth', {
            get: () => this.getFeatureAttr('colorDepth', 24)
        })

        origPropertyValues.pixelDepth = globalThis.screen.pixelDepth
        wrapProperty(globalThis.Screen.prototype, 'pixelDepth', {
            get: () => this.getFeatureAttr('pixelDepth', 24)
        })

        globalThis.window.addEventListener('resize', function () {
            setWindowDimensions()
        })
        setWindowDimensions()
    }
}
