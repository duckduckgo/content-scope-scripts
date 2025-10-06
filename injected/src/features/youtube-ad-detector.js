import ContentFeature from '../content-feature.js'
import { AdDetector } from './youtube-detection/ad-detector.js'

/**
 * @module YouTube Ad Detector
 *
 * @description
 * Detects and reports when ads are displayed on YouTube. Shows toast notifications
 * and logs to console when ad UI elements are detected.
 */
export default class YoutubeAdDetector extends ContentFeature {
    init (args) {
        // Only run on youtube.com
        const domain = args.site.domain
        if (!domain || !domain.includes('youtube.com')) {
            return
        }

        // Check if the feature is enabled via config
        const enabled = this.getFeatureSetting('state')
        if (enabled !== 'enabled') {
            return
        }

        this.startDetection()
    }

    startDetection () {
        console.log('[YouTube Ad Detector] Starting ad detection on', window.location.hostname)

        // Create and start the ad detector
        const detector = new AdDetector()
        detector.start()

        // Expose stop function for debugging
        window.__stopAdDetector = () => {
            detector.stop()
        }
    }
}

