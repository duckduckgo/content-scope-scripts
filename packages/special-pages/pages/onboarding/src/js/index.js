/**
 * @module Onboarding
 * @category Special Pages
 *
 * @description
 *
 */
import {
    createOnboardingMessaging
} from './messages'
import { render, h } from 'preact'
import { App } from '../../app/app'

// share this in the app, it's an instance of `OnboardingMessages` where all your native comms should be
const messaging = createOnboardingMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env
})

console.log(messaging)

const root = document.querySelector('main')
if (root) {
    render(<App />, root)
} else {
    console.error('could not render, root element missing')
}
