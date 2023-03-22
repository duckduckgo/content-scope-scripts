/**
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
import { MessagingTransport, NotificationMessage, RequestMessage } from '../index.js'

/**
 * @implements {MessagingTransport}
 */
export class WindowsMessagingTransport {
  config
  /**
   * @param {WindowsMessagingConfig} config
   * @param {import("../index.js").MessagingContext} messagingContext
   */
  constructor(config, messagingContext) {
    this.messagingContext = messagingContext;
    this.config = config
    for (let [methodName, fn] of Object.entries(this.config.methods)) {
      if (typeof fn !== 'function') {
        throw new Error('cannot create WindowsMessagingTransport, missing the method: ' + methodName)
      }
    }
  }
  /**
   * @param {import("../index.js").NotificationMessage} msg
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  notify(msg) {
    // console.log('🙏 windows transport, sending a notification', JSON.stringify(msg, null, 2))
    const notification = WindowsNotification.fromNotification(msg);
    this.config.methods.postMessage(notification)
  }
  /**
   * @param {import("../index.js").RequestMessage} msg
   * @param {{signal?: AbortSignal}} opts
   * @return {Promise<any>}
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request(msg, opts = {}) {
    const outgoing = WindowsRequestMessage.fromRequest(msg);
    this.config.methods.postMessage(outgoing)
    const comparator = (eventData) => {
      return eventData.featureName === msg.featureName
          && eventData.context === msg.context
          && eventData.id === msg.id
    }
    // return waitForSingleWindowsResponse(this.messagingContext, this.config, id, opts)
    return new Promise((resolve, reject) => {
      try {
        this._subscribe(comparator, opts, (value, unsubscribe) => {
          unsubscribe();
          if ('result' in value) {
            resolve(value['result']);
          } else if ('error' in value) {
            // @ts-expect-error
            reject(new Error(value.error.message || 'unknown error'))
          } else {
            console.warn('unknown response', value);
            reject(new Error('unknown response'))
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }
  /**
   * @param {import("../index.js").Subscription} msg
   * @param {(value: unknown) => void} callback
   */
  subscribe(msg, callback) {
    const comparator = (eventData) => {
      return eventData.featureName === msg.featureName
          && eventData.context === msg.context
          && eventData.subscriptionName === msg.subscriptionName
    }
    const cb = (eventData) => {
      if ('params' in eventData) return callback(eventData['params']);
      console.warn("debug: params field missing in subscription event", eventData)
    }
    return this._subscribe(comparator, {}, cb)
  }

  /**
   * @typedef {import("../index.js").MessageResponse | import("../index.js").SubscriptionEvent} Incoming
   * @param {(eventData: any) => boolean} comparator
   * @param {{signal?: AbortSignal}} options
   * @param {(value: Incoming, unsubscribe: (()=>void)) => void} callback
   */
  _subscribe(comparator, options, callback) {
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
    const idHandler = (event) => {
      if (this.messagingContext.env === "production") {
        if (event.origin !== null && event.origin !== undefined) {
          console.warn("ignoring because evt.origin is not `null` or `undefined`");
          return;
        }
      }
      if (!event.data) {
        console.warn('data absent from message')
        return
      }
      if (comparator(event.data)) {
        if (!teardown) throw new Error('unreachable')
        callback(event.data, teardown)
      } else {
        console.warn('x comparator failed for ', event)
      }
    }

    // what to do if this promise is aborted
    const abortHandler = () => {
      teardown?.()
      throw new DOMException('Aborted', 'AbortError')
    }

    // console.log('DEBUG: handler setup', { config, comparator })
    // eslint-disable-next-line no-undef
    this.config.methods.addEventListener('message', idHandler)
    options?.signal?.addEventListener('abort', abortHandler)

    teardown = () => {
      // console.log('DEBUG: handler teardown', { config, comparator })
      // eslint-disable-next-line no-undef
      this.config.methods.removeEventListener('message', idHandler)
      options?.signal?.removeEventListener('abort', abortHandler)
    }

    return () => {
      teardown?.()
    }
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
   * @param {WindowsInteropMethods} params.methods
   */
  constructor(params) {
    /**
     * The methods required for communication
     */
    this.methods = params.methods
    /**
     * @type {"windows"}
     */
    this.platform = 'windows'
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
 * This data type represents a message sent to the Windows
 * platform via `window.chrome.webview.postMessage`
 */
export class WindowsNotification {
  /**
   * @param {object} params
   * @param {string} params.Feature
   * @param {string} params.SubFeatureName
   * @param {string} params.Name
   * @param {Record<string, any>} [params.Data]
   */
  constructor (params) {
    this.Feature = params.Feature
    this.SubFeatureName = params.SubFeatureName
    this.Name = params.Name
    this.Data = params.Data
  }

  /**
   * @param {NotificationMessage} notification
   * @returns {WindowsNotification}
   */
  static fromNotification(notification) {
    /** @type {WindowsNotification} */
    const output = {
      Data: JSON.parse(JSON.stringify(notification.params || {})),
      Feature: notification.context,
      SubFeatureName: notification.featureName,
      Name: notification.method,
    }
    return output;
  }
}

/**
 * This data type represents a message sent to the Windows
 * platform via `window.chrome.webview.postMessage` when it
 * expects a response
 */
export class WindowsRequestMessage {
  /**
   * @param {object} params
   * @param {string} params.Feature
   * @param {string} params.SubFeatureName
   * @param {string} params.Name
   * @param {Record<string, any>} [params.Data]
   * @param {string} [params.Id]
   */
  constructor (params) {
    this.Feature = params.Feature
    this.SubFeatureName = params.SubFeatureName
    this.Name = params.Name
    this.Data = params.Data
    this.Id = params.Id
  }

  /**
   * @param {RequestMessage} msg
   * @returns {WindowsRequestMessage}
   */
  static fromRequest(msg) {
    /** @type {WindowsRequestMessage} */
    const output = {
      Data: JSON.parse(JSON.stringify(msg.params || {})),
      Feature: msg.context,
      SubFeatureName: msg.featureName,
      Name: msg.method,
      Id: msg.id,
    }
    return output;
  }
}
