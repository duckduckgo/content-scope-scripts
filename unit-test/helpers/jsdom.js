import { JSDOM } from 'jsdom'

beforeEach(() => {
    const { window } = new JSDOM()
    // eslint-disable-next-line no-global-assign
    globalThis.navigator = window.navigator
    globalThis.Navigator = window.Navigator
})
