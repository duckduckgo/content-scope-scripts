export function init () {
    if ('browsingTopics' in Document.prototype) {
        try {
            delete Document.prototype.browsingTopics
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }
}
