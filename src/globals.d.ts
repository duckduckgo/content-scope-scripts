declare var mozProxies: boolean;
declare function exportFunction(fn: Function, desc: object, out: object): void;
declare function exportFunction(fn: Function, desc: object): void;
declare function cloneInto(fn: object, desc: object, out: object): void;
declare function cloneInto(fn: object, desc: object): void;

declare var Bluetooth: any;
declare var USB: any;
declare var HID: any;
declare var Serial: any;

interface Window {
  safari: any
  globalObj: any
  wrappedJSObject: any

  __content_scope_status: any
}

interface Navigator {
  joinAdInterestGroup: any
  leaveAdInterestGroup: any
  updateAdInterestGroups: any
  runAdAuction: any
  adAuctionComponents: any
  duckduckgo: any

  globalPrivacyControl: any
  webkitTemporaryStorage: any
  deviceMemory: any
  keyboard: any

  getBattery: any
}

interface Document {
  browsingTopics: any
}
