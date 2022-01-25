declare var exportFunction: (...args: any[]) => void;
declare var mozProxies: any
declare var $CONTENT_SCOPE$: Record<string, any>
declare var $USER_UNPROTECTED_DOMAINS$: string[];
declare var $USER_PREFERENCES$: Record<string, any>;
declare var contentScopeFeatures: ContentScope
interface ContentScope {
  load();
  init(message: Record<string, any>)
  update(message: Record<string, any>)
}
interface Navigator {
  globalPrivacyControl: boolean
  webkitTemporaryStorage?: any
  deviceMemory?: any
  keyboard?: any
  getBattery?: any
}
interface Document {
  interestCohort?: any
}
interface Screen {
  readonly availTop: number;
  readonly availLeft: number;
}
declare namespace NodeJS {
  export interface ProcessEnv {
    KEEP_OPEN?: string|boolean;
    CI?: string|boolean;
  }
}
declare var BatteryManager: any
declare var FingerprintJS: any
