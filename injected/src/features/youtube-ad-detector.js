import ContentFeature from '../content-feature.js'
import { AdDetector } from './youtube-detection/ad-detector.js'
import { UserTypeDetector, UserType } from './youtube-detection/user-type-detector.js'
import { BotDetectionDetector } from './youtube-detection/bot-detection-detector.js'
import { BreakageDetector } from './youtube-detection/breakage-detector.js'

/**
 * @module YouTube Ad Detector
 *
 * @description
 * Detects and reports when ads are displayed on YouTube. Shows toast notifications
 * and logs to console when ad UI elements are detected. Also tracks user type and bot detection.
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
        console.log('[YouTube Detection] Starting detection on', window.location.hostname)

        // Create and start the user type detector
        const userTypeDetector = new UserTypeDetector()
        userTypeDetector.start((userType) => {
            console.log('[YouTube User Type]', userTypeDetector.getUserTypeString(), { userType })
        })

        // Create and start the ad detector
        const detector = new AdDetector()
        detector.start()

        // Create and start the bot detection detector
        const botDetector = new BotDetectionDetector()
        botDetector.start((detection) => {
            console.log('[YouTube Bot Detection]', detection)
        })

        // Create and start the breakage detector
        const breakageDetector = new BreakageDetector()
        breakageDetector.start((detection) => {
            console.log('[YouTube Breakage]', detection)
        })

        // Expose utility functions for debugging
        window.__stopAdDetector = () => {
            detector.stop()
            userTypeDetector.stop()
            botDetector.stop()
            breakageDetector.stop()
        }

        window.__getUserType = () => {
            return {
                type: userTypeDetector.getCurrentType(),
                description: userTypeDetector.getUserTypeString()
            }
        }

        window.__getBotDetection = () => {
            return botDetector.getCurrentDetection()
        }

        window.__getBreakage = () => {
            return breakageDetector.getCurrentDetection()
        }
    }
}

