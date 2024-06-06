import ContentFeature from "../content-feature.js";

export default class MyFeature extends ContentFeature {
    init () {
        try {
            console.log('your code here!')
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }
}
