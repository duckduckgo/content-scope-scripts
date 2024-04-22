/**
 * @module WebCompat Messages
 * @description
 *
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 */

/**
 * Requests, Notifications and Subscriptions from the WebCompat feature
 */
export interface WebCompatMessages {
  requests: WebShareRequest;
}
/**
 * Generated from @see "../messages/web-compat/webShare.request.json"
 */
export interface WebShareRequest {
  method: "webShare";
  params: WebShareParams;
}
/**
 * todo: add description for `webShare` message
 */
export interface WebShareParams {
  /**
   * todo: add description for 'title' field
   */
  title?: string;
  /**
   * todo: add description for 'url' field
   */
  url?: string;
  /**
   * todo: add description for 'text' field
   */
  text?: string;
}

/**
 * The following types enforce a schema-first workflow for messages 
 */ 
declare module "../features/web-compat.js" {
  export interface WebCompat {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<WebCompatMessages>['request']
  }
}

declare module "../content-feature.js" {
  interface BaseStrictPropertyDescriptor {
    configurable: boolean;
    enumerable: boolean;
  }

  interface StrictDataDescriptor extends BaseStrictPropertyDescriptor {
    value: any;
    writable: boolean;
  }

  interface StrictGetDescriptor extends BaseStrictPropertyDescriptor {
    get: () => any;
  }

  interface StrictSetDescriptor extends BaseStrictPropertyDescriptor {
    set: (v: any) => void;
  }

  interface StrictGetSetDescriptor extends BaseStrictPropertyDescriptor {
    get: () => any;
    set: (v: any) => void;
  }

  export type StrictPropertyDescriptor = StrictDataDescriptor | StrictSetDescriptor | StrictGetDescriptor | StrictGetSetDescriptor;

  type DefineInterfaceOptions = {
    interfaceDescriptorOptions: StrictDataDescriptor;
    constructorErrorMessage: string; // Error message to throw when constructor is called. Ignored when `disallowConstructor` is false
    overridePrototypeObject: object; // Object to use as prototype for the interface instances
    wrapToString: boolean; // Mask the `toString` representation of class methods, default is true
  } & ({
    allowConstructorCall: true; // Allow calling the constructor function without `new`, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
    disallowConstructor: false; // Disallow creating new instances, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
  } | {
    allowConstructorCall: false; // Allow calling the constructor function without `new`, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
    disallowConstructor: true; // Disallow creating new instances, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
  } | {
    allowConstructorCall: false; // Allow calling the constructor function without `new`, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
    disallowConstructor: false; // Disallow creating new instances, default is false. `allowConstructorCall` and `disallowConstructor` cannot be true at the same time
  });
}