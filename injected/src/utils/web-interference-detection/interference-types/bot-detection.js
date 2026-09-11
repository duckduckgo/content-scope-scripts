import { detectCloudflareTurnstile, detectCloudflareChallengePage } from '../vendors/cloudflare.js';
import { detectHCaptcha } from '../vendors/hcaptcha.js';

const challengeDetectorsMap = {
    cloudflare_turnstile: detectCloudflareTurnstile,
    cloudflare_challenge_page: detectCloudflareChallengePage,
    hcaptcha: detectHCaptcha,
};

export function detectBotInterference() {
    const results = [];

    for (const [challengeName, detector] of Object.entries(challengeDetectorsMap)) {
        try {
            const result = detector();
            if (result.detected) {
                results.push(result);
            }
        } catch (error) {
            console.warn(`[web-interference-detection] ${challengeName} detector failed:`, error);
        }
    }

    return {
        detected: results.length > 0,
        interferenceType: 'bot_detection',
        results,
        timestamp: Date.now(),
    };
}
