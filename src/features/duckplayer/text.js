import { html } from '../../dom-utils'

/**
 * If this get's localised in the future, this would likely be in a json file
 */
const text = {
    playText: {
        title: 'Duck Player'
    },
    videoOverlayTitle: {
        title: 'Tired of targeted YouTube ads and recommendations?'
    },
    videoOverlayTitle_a1: {
        title: 'Turn on Duck Player to watch without targeted ads'
    },
    videoOverlayTitle_b1: {
        title: 'Drowning in ads in YouTube? {newline} Turn on Duck Player.'
    },
    videoOverlaySubtitle: {
        title: 'Duck Player provides a clean viewing experience without personalized ads and prevents viewing activity from influencing your YouTube recommendations.'
    },
    videoOverlaySubtitle_a1_b1: {
        title: 'What you watch in DuckDuckGo won’t influence your recommendations on YouTube.'
    },
    videoButtonOpen: {
        title: 'Watch in Duck Player'
    },
    videoButtonOpen_a1_b1: {
        title: 'Turn On Duck Player'
    },
    videoButtonOptOut: {
        title: 'Watch Here'
    },
    videoButtonOptOut_a1_b1: {
        title: 'No Thanks'
    },
    rememberLabel: {
        title: 'Remember my choice'
    }
}

export const i18n = {
    /**
     * @param {keyof text} name
     */
    t (name) {
        // eslint-disable-next-line no-prototype-builtins
        if (!text.hasOwnProperty(name)) {
            console.error(`missing key ${name}`)
            return 'missing'
        }
        const match = text[name]
        if (!match.title) {
            return 'missing'
        }
        return match.title
    }
}

/**
 * Converts occurrences of {newline} in a string to <br> tags
 * @param {string} text
 */
export function nl2br (text) {
    return html`${text.split('{newline}')
        .map((line, i) => i === 0 ? line : html`<br>${line}`)}`
}

/**
 * @typedef {ReturnType<html>} Template
 */

/**
 * @typedef {Object} OverlayCopyTranslation
 * @property {string | Template} title
 * @property {string | Template} subtitle
 * @property {string | Template} buttonOptOut
 * @property {string | Template} buttonOpen
 * @property {string | Template} rememberLabel
 */

/**
 *  @type {Record<import('../duck-player').UISettings['overlayCopy'], OverlayCopyTranslation>}
 */
export const overlayCopyVariants = {
    default: {
        title: i18n.t('videoOverlayTitle'),
        subtitle: html`<b>${i18n.t('playText')}</b> ${i18n.t('videoOverlaySubtitle')}`,
        buttonOptOut: i18n.t('videoButtonOptOut'),
        buttonOpen: i18n.t('videoButtonOpen'),
        rememberLabel: i18n.t('rememberLabel')
    },
    a1: {
        title: i18n.t('videoOverlayTitle_a1'),
        subtitle: i18n.t('videoOverlaySubtitle_a1_b1'),
        buttonOptOut: i18n.t('videoButtonOptOut_a1_b1'),
        buttonOpen: i18n.t('videoButtonOpen_a1_b1'),
        rememberLabel: i18n.t('rememberLabel')
    },
    b1: {
        title: nl2br(i18n.t('videoOverlayTitle_b1')),
        subtitle: i18n.t('videoOverlaySubtitle_a1_b1'),
        buttonOptOut: i18n.t('videoButtonOptOut_a1_b1'),
        buttonOpen: i18n.t('videoButtonOpen_a1_b1'),
        rememberLabel: i18n.t('rememberLabel')
    }
}
