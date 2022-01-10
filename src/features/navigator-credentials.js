import { defineProperty } from '../utils'

export function init (args) {
    try {
        const value = {
            get () {
                return Promise.reject(new Error())
            }
        }
        defineProperty(Navigator.prototype, 'credentials', {
            value,
            configurable: true,
            enumerable: true
        })
    } catch {
        // Ignore exceptions that could be caused by conflicting with other extensions
    }
}
