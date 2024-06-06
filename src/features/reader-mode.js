import ContentFeature from '../content-feature'

export class ReaderMode extends ContentFeature {
    init () {
        this.notify('readModeAvailable')
    }
}

export default ReaderMode
