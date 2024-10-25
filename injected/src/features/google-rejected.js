import ContentFeature from '../content-feature'

export default class GoogleRejected extends ContentFeature {
    init () {
        try {
            if ('browsingTopics' in Document.prototype) {
                delete Document.prototype.browsingTopics
            }
            if ('joinAdInterestGroup' in Navigator.prototype) {
                delete Navigator.prototype.joinAdInterestGroup
            }
            if ('leaveAdInterestGroup' in Navigator.prototype) {
                delete Navigator.prototype.leaveAdInterestGroup
            }
            if ('updateAdInterestGroups' in Navigator.prototype) {
                delete Navigator.prototype.updateAdInterestGroups
            }
            if ('runAdAuction' in Navigator.prototype) {
                delete Navigator.prototype.runAdAuction
            }
            if ('adAuctionComponents' in Navigator.prototype) {
                delete Navigator.prototype.adAuctionComponents
            }
            // https://github.com/WICG/privacy-preserving-ads/blob/main/API%20Details.md
            if (this.getFeatureSetting('getInterestGroupAdAuctionData')) {
                if ('getInterestGroupAdAuctionData' in Navigator.prototype) {
                    delete Navigator.prototype.getInterestGroupAdAuctionData
                
            }
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }
}
