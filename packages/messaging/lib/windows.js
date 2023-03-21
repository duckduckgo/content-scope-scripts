/**
 * @module Windows Messaging
 *
 * @description
 *
 * A wrapper for messaging on Windows.
 *
 * This requires 3 methods to be available, see {@link WindowsMessagingConfig} for details
 *
 * @example
 *
 * ```javascript
 * [[include:packages/messaging/lib/examples/windows.example.js]]```
 *
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessagingTransport } from '../'

/**
 * @implements {MessagingTransport}
 */
export class WindowsMessagingTransport {
  config
  /**
   * @param {WindowsMessagingConfig} config
   */
  constructor(config) {
    this.config = config
    for (let [methodName, fn] of Object.entries(this.config.methods)) {
      if (typeof fn !== 'function') {
        throw new Error('cannot create WindowsMessagingTransport, missing the method: ' + methodName)
      }
    }
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  notify(name, data = {}) {
    windowsTransport(this.config, name, data, {})
  }
  /**
   * @param {string} name
   * @param {Record<string, any>} [data]
   * @param {{signal?: AbortSignal}} opts
   * @return {Promise<any>}
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request(name, data = {}, opts = {}) {
    return windowsTransport(this.config, name, data, opts).withResponse(name + 'Response')
  }

  /**
   * @param {string} name
   * @param {(value: unknown) => void} callback
   */
  subscribe(name, callback) {
    return subscribe(this.config, name, {}, callback)
  }
}

/**
 * To construct this configuration object, you need access to 3 methods
 *
 * - `postMessage`
 * - `addEventListener`
 * - `removeEventListener`
 *
 * These would normally be available on Windows via the following:
 *
 * - `window.chrome.webview.postMessage`
 * - `window.chrome.webview.addEventListener`
 * - `window.chrome.webview.removeEventListener`
 *
 * However, we may want to restrict access to those globals, which is why this configuration
 * requires direct access to the methods, without knowing where they came from - so they
 * are probably provided within a lexical scope.
 *
 */
export class WindowsMessagingConfig {
  /**
   * @param {object} params
   * @param {string} params.featureName
   * @param {WindowsInteropMethods} params.methods
   */
  constructor(params) {
    /**
     * @type {string}
     */
    this.featureName = params.featureName
    /**
     * The methods required for communication
     */
    this.methods = params.methods
    /**
     * @type {"windows"}
     */
    this.platform = 'windows'
    // /**
    //  * These are the global method names that are expected to be
    //  * available in the same lexical scope as the script running (eg: **not** attached to the
    //  * global window object)
    //  */
    // this.methodNamesInScope = /** @type {const} */ ([
    //   'windowsInteropPostMessage',
    //   'windowsInteropAddEventListener',
    //   'windowsInteropRemoveEventListener',
    // ])
  }
}

/**
 * These are the required methods
 */
export class WindowsInteropMethods {
  /**
   * @param {object} params
   * @param {Window['postMessage']} params.postMessage
   * @param {Window['addEventListener']} params.addEventListener
   * @param {Window['removeEventListener']} params.removeEventListener
   */
  constructor(params) {
    this.postMessage = params.postMessage
    this.addEventListener = params.addEventListener
    this.removeEventListener = params.removeEventListener
  }
}

/**
 * @param {WindowsMessagingConfig} config
 * @param {string} name
 * @param {Record<string, any>} data
 * @param {{signal?: AbortSignal}} options
 */
function windowsTransport(config, name, data, options) {
  // eslint-disable-next-line no-undef
  config.methods.postMessage({
    Feature: config.featureName,
    Name: name,
    Data: data,
  })
  return {
    /**
     * Sends a message and returns a Promise that resolves with the response
     * @param {string} responseId
     * @returns {Promise<*>}
     */
    withResponse(responseId) {
      return waitForWindowsResponse(config, responseId, options)
    },
  }
}
/**
 * @param {WindowsMessagingConfig} config
 * @param {string} responseId
 * @param {{signal?: AbortSignal}} options
 * @returns {Promise<any>}
 */
function waitForWindowsResponse(config, responseId, options) {
  return new Promise((resolve, reject) => {
    try {
      subscribe(config, responseId, options, (value, unsubscribe) => {
        resolve(value)
        unsubscribe()
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * @param {WindowsMessagingConfig} config
 * @param {string} name
 * @param {{signal?: AbortSignal}} options
 * @param {(value: unknown, unsubscribe: (()=>void)) => void} callback
 */
function subscribe(config, name, options, callback) {
  // if already aborted, reject immediately
  if (options?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  /** @type {(()=>void) | undefined} */
  let teardown

  // The event handler
  /**
   * @param {MessageEvent} event
   */
  const handler = (event) => {
    console.log(`📩 windows, ${window.location.href}`, [event.origin, JSON.stringify(event.data)])
    if (!event.data) {
      console.warn('data absent from message')
      return
    }
    if (event.data.Feature === config.featureName && event.data.Name === name) {
      if (!teardown) throw new Error('unreachable')
      callback(event.data.Data, teardown)
    }
  }

  // what to do if this promise is aborted
  const abortHandler = () => {
    teardown?.()
    throw new DOMException('Aborted', 'AbortError')
  }

  console.log('DEBUG: handler setup', { feature: config.featureName, name })
  // eslint-disable-next-line no-undef
  config.methods.addEventListener('message', handler)
  options?.signal?.addEventListener('abort', abortHandler)

  teardown = () => {
    console.log('DEBUG: handler teardown', { feature: config.featureName, name })
    // eslint-disable-next-line no-undef
    config.methods.removeEventListener('message', handler)
    options?.signal?.removeEventListener('abort', abortHandler)
  }

  return () => {
    teardown?.()
  }
}
