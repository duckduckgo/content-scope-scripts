import ContentFeature from '../content-feature'

export default class ReadMode extends ContentFeature {
    init () {
        this.notify('readModeAvailable')
    }
}
