/**
 * @module YouTube User Type Detector
 * @description Detects whether the user is logged in, not logged in, or a premium user
 */

/**
 * User type constants
 * @enum {string}
 */
export const UserType = {
    NOT_LOGGED_IN: 'not_logged_in',
    LOGGED_IN: 'logged_in',
    PREMIUM: 'premium'
}

/**
 * Detects the current user type based on DOM indicators
 * @returns {UserType} The detected user type
 */
export class UserTypeDetector {
    constructor () {
        this.lastDetectedType = null
        this.checkInterval = null
    }

    /**
     * Start monitoring user type
     * @param {Function} onTypeChange - Callback when user type changes
     */
    start (onTypeChange) {
        this.onTypeChange = onTypeChange

        // Initial detection
        const initialType = this.detectUserType()
        this.lastDetectedType = initialType
        if (this.onTypeChange) {
            this.onTypeChange(initialType)
        }

        // Retry once after 2 seconds to catch lazy-loaded elements (like account menu)
        setTimeout(() => {
            const currentType = this.detectUserType()
            if (currentType !== this.lastDetectedType) {
                this.lastDetectedType = currentType
                if (this.onTypeChange) {
                    this.onTypeChange(currentType)
                }
            }
        }, 2000)

        // Listen for navigation changes (YouTube is a SPA)
        this.navigationObserver = new MutationObserver(() => {
            // Debounce: only check after navigation settles
            clearTimeout(this.navigationTimeout)
            this.navigationTimeout = setTimeout(() => {
                const currentType = this.detectUserType()
                if (currentType !== this.lastDetectedType) {
                    this.lastDetectedType = currentType
                    if (this.onTypeChange) {
                        this.onTypeChange(currentType)
                    }
                }
            }, 1000)
        })

        // Watch for URL changes in the page title or ytd-app
        const ytdApp = document.querySelector('ytd-app')
        if (ytdApp) {
            this.navigationObserver.observe(ytdApp, {
                attributes: true,
                attributeFilter: ['page-subtype']
            })
        }
    }

    /**
     * Stop monitoring user type
     */
    stop () {
        if (this.navigationObserver) {
            this.navigationObserver.disconnect()
            this.navigationObserver = null
        }
        if (this.navigationTimeout) {
            clearTimeout(this.navigationTimeout)
            this.navigationTimeout = null
        }
    }

    /**
     * Detect user type based on DOM elements
     * @returns {UserType}
     */
    detectUserType () {
        const isPremium = this.isPremiumUser()
        const isLoggedIn = this.isLoggedIn()

        // Debug logging
        console.log('[User Type Detector] Debug:', {
            isPremium,
            isLoggedIn,
            ytcfgKeys: window.ytcfg ? Object.keys(window.ytcfg.d()) : 'not available',
            premiumLogo: !!document.querySelector('yt-premium-logo-renderer'),
            avatarButton: !!document.querySelector('#avatar-btn')
        })

        // Check for premium indicators first (most specific)
        if (isPremium) {
            return UserType.PREMIUM
        }

        // Check if user is logged in
        if (isLoggedIn) {
            return UserType.LOGGED_IN
        }

        // Default to not logged in
        return UserType.NOT_LOGGED_IN
    }

    /**
     * Check if user is a YouTube Premium subscriber
     * @returns {boolean}
     */
    isPremiumUser () {
        // MUST be logged in to be premium
        if (!this.isLoggedIn()) {
            return false
        }

        // Check for premium logo renderer (most reliable)
        const premiumLogo = document.querySelector('yt-premium-logo-renderer, ytd-topbar-logo-renderer[is-premium]')
        if (premiumLogo) {
            return true
        }

        // Check for premium badge/icon in the topbar/masthead
        const premiumIcon = document.querySelector('ytd-masthead [aria-label*="Premium" i], ytd-topbar-menu-button-renderer [aria-label*="Premium" i]')
        if (premiumIcon) {
            return true
        }

        // Check for "Purchases and memberships" or "Your Premium benefits" menu item
        const premiumMenuItem = document.querySelector('ytd-compact-link-renderer a[href*="/purchases"], ytd-guide-entry-renderer a[href*="/purchases"], ytd-compact-link-renderer a[href*="premium"]')
        if (premiumMenuItem) {
            return true
        }

        // Check for "Your Premium benefits" text specifically in user menu (not promotional content)
        const accountMenu = document.querySelector('ytd-multi-page-menu-renderer[style*="ACCOUNT"]')
        if (accountMenu) {
            const premiumBenefitsText = Array.from(accountMenu.querySelectorAll('yt-formatted-string, ytd-compact-link-renderer'))
                .find(el => el.textContent?.includes('Premium benefits') || el.textContent?.includes('Your Premium'))
            if (premiumBenefitsText) {
                return true
            }
        }

        // Check page data for explicit premium status
        if (window.yt?.config_?.PREMIUM === true) {
            return true
        }

        // Check ytcfg for explicit premium flag
        if (typeof window.ytcfg?.get === 'function') {
            const premiumStatus = window.ytcfg.get('PREMIUM')
            if (premiumStatus === true || premiumStatus === 1) {
                return true
            }
        }

        // Note: We don't check ytInitialData for 'premium' string as it appears
        // in promotional content for all users, not just premium subscribers

        return false
    }

    /**
     * Check if user is logged in (including premium users)
     * @returns {boolean}
     */
    isLoggedIn () {
        // Check for user avatar button (indicates logged in)
        const avatarButton = document.querySelector('#avatar-btn, ytd-topbar-menu-button-renderer button[aria-label*="Account" i]')
        if (avatarButton) {
            return true
        }

        // Check for user menu button with image
        const userButton = document.querySelector('ytd-topbar-menu-button-renderer img[alt], button#avatar-btn img')
        if (userButton) {
            return true
        }

        // Check window.yt config
        if (window.yt?.config_?.LOGGED_IN === true) {
            return true
        }

        // Check ytcfg
        if (typeof window.ytcfg?.get === 'function') {
            const loggedIn = window.ytcfg.get('LOGGED_IN')
            if (loggedIn === true || loggedIn === 1) {
                return true
            }
        }

        // If sign in button exists, user is NOT logged in
        const signInButton = document.querySelector('ytd-button-renderer a[href*="accounts.google.com"], a[aria-label*="Sign in" i]')
        if (signInButton) {
            return false
        }

        return false
    }

    /**
     * Get current user type without starting monitoring
     * @returns {UserType}
     */
    getCurrentType () {
        return this.detectUserType()
    }

    /**
     * Get user type as a human-readable string
     * @returns {string}
     */
    getUserTypeString () {
        const type = this.lastDetectedType || this.detectUserType()
        switch (type) {
            case UserType.PREMIUM:
                return 'Premium User'
            case UserType.LOGGED_IN:
                return 'Logged In User'
            case UserType.NOT_LOGGED_IN:
                return 'Not Logged In'
            default:
                return 'Unknown'
        }
    }
}
