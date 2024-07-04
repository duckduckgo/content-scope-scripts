/**
 * If this get's localised in the future, this would likely be in a json file
 */
const text = {
    playText: {
        title: 'Duck Player'
    },
    videoOverlayTitle_default: {
        title: 'Tired of targeted YouTube ads and recommendations?'
    },
    videoOverlayTitle_v1: {
        title: 'Turn on Duck Player to watch without targeted ads'
    },
    videoOverlayTitle_v2: {
        title: 'Drowning in ads in YouTube?{newline}Turn on Duck Player.'
    },
    videoOverlaySubtitle_default: {
        title: 'provides a clean viewing experience without personalized ads and prevents viewing activity from influencing your YouTube recommendations.'
    },
    videoOverlaySubtitle_v1: {
        title: 'What you watch in DuckDuckGo won’t influence your recommendations on YouTube.'
    },
    videoOverlaySubtitle_v2: {
        title: 'What you watch in DuckDuckGo won’t influence your recommendations on YouTube.'
    },
    videoButtonOpen_default: {
        title: 'Watch in Duck Player'
    },
    videoButtonOpen_v1: {
        title: 'Turn On Duck Player'
    },
    videoButtonOpen_v2: {
        title: 'Turn On Duck Player'
    },
    videoButtonOptOut_default: {
        title: 'Watch Here'
    },
    videoButtonOptOut_v1: {
        title: 'No Thanks'
    },
    videoButtonOptOut_v2: {
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
