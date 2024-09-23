import ContentFeature from '../content-feature'
import { getElement } from './broker-protection/utils'

export default class PasswordImport extends ContentFeature {
    init () {
        document.addEventListener('DOMContentLoaded', () => {
            const xpath = "//div[text()='Export passwords']/ancestor::li" // Should be configurable
            const exportElement = getElement(document, xpath)
            if (exportElement) {
                exportElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                }) // Scroll into view
                const keyframes = [
                    { backgroundColor: 'transparent' },
                    { backgroundColor: 'lightblue' },
                    { backgroundColor: 'transparent' }
                ]

                // Define the animation options
                const options = {
                    duration: 1000, // 1 seconds, should be configurable
                    iterations: 3 // Max 3 blinks, should be configurable
                }

                // Apply the animation to the element
                exportElement.animate(keyframes, options)
            }
        })
    }
}
