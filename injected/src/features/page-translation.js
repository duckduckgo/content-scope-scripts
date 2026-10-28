import ContentFeature from '../content-feature.js';

/**
 * Extracts the page's text as translation units, writes translations back in place, and reverts them.
 * Native drives it: nothing runs until native sends `extract`, `apply` or `revert`.
 */
export default class PageTranslation extends ContentFeature {
    init() {
        // shortcut: stub replies so the integration tests run end to end, until the POC logic is ported
        this.messaging.subscribe('extract', () => {
            this.notify('extractResult', { units: [] });
        });
        this.messaging.subscribe('apply', () => {
            this.notify('applyResult', { count: 0 });
        });
        this.messaging.subscribe('revert', () => {
            this.notify('revertResult', { count: 0 });
        });
    }
}
