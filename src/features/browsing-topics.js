export function init () {
    if ('browsingTopics' in Document.prototype) {
        try {
            delete Document.prototype.browsingTopics
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }

    if ('joinAdInterestGroup' in Navigator.prototype) {
        try {
            delete Navigator.prototype.joinAdInterestGroup
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }

    if ('runAdAuction' in Navigator.prototype) {
        try {
            delete Navigator.prototype.runAdAuction
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }
}
