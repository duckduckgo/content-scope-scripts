import { h } from 'preact'
import { Launch, Replay } from '../../components/Icons'
import { CustomizeStep } from './CustomizeStep'
import { ImportStep } from './ImportStep'
import { DockStep } from './DockStep'
import { MakeDefaultStep } from './MakeDefaultStep'
import { DuckPlayerStep } from './DuckPlayerStep'
import { ElasticButton } from '../Buttons'
import { Timeout } from '../Timeout'

/** @type {Record<import('./data-types').StepsV3, (params: import('./data-types').StepConfigParams) => import('./data-types').StepConfig>} */
export const stepsConfig = {
    welcome: ({ t, advance }) => {
        return {
            variant: 'plain',
            heading: {
                title: t('welcome_title'),
                speechBubble: false,
                children: <Timeout onComplete={advance} ignore={true} />
            }
        }
    },
    getStarted: ({ t, advance }) => {
        return {
            variant: 'plain',
            heading: {
                title: t('getStarted_title_v3').split('{newline}'),
                speechBubble: true,
                children: <ElasticButton onClick={advance}>{t('getStartedButton_v3')}</ElasticButton>
            }
        }
    },
    makeDefaultSingle: ({ t, globalState, advance, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues['default-browser'] === 'idle'

        return {
            variant: 'box',
            heading: {
                title: isIdle ? t('protectionsActivated_title') : t('makeDefaultAccept_title'),
                speechBubble: true
            },
            dismissButton: isIdle
                ? {
                    text: t('skipButton'),
                    handler: advance
                }
                : null,
            acceptButton: isIdle
                ? {
                    text: t('makeDefaultButton'),
                    handler: () => enableSystemValue('default-browser')
                }
                : {
                    text: t('nextButton'),
                    handler: advance
                },
            content: <MakeDefaultStep />
        }
    },
    dockSingle: ({ t, platformName, globalState, advance, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues.dock === 'idle'

        let title = isIdle ? t('dock_title') : t('dockAccept_title', { newline: '\n' })
        let idleButtonText = t('keepInDockButton')

        if (platformName === 'windows') {
            title = isIdle ? t('taskbar_title') : t('taskbarAccept_title', { newline: '\n' })
            idleButtonText = t('nextButton')
        }

        return {
            variant: 'box',
            heading: {
                title,
                subtitle: isIdle ? t('dock_taskbar_subtitle') : null,
                speechBubble: true
            },
            dismissButton: platformName !== 'windows' && isIdle
                ? {
                    text: t('skipButton'),
                    handler: advance
                }
                : null,
            acceptButton: isIdle
                ? {
                    text: idleButtonText,
                    handler: () => enableSystemValue('dock')
                }
                : {
                    text: t('nextButton'),
                    handler: advance
                },
            content: <DockStep />
        }
    },
    importSingle: ({ t, globalState, advance, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues.import === 'idle'

        return {
            variant: 'box',
            heading: {
                title: t('import_title', { newline: '\n' }),
                subtitle: t('import_subtitle'),
                speechBubble: true
            },
            dismissButton: isIdle
                ? {
                    text: t('skipButton'),
                    handler: advance
                }
                : null,
            acceptButton: isIdle
                ? {
                    text: t('importButton'),
                    handler: () => enableSystemValue('import')
                }
                : {
                    text: t('nextButton'),
                    handler: advance
                },
            content: <ImportStep />
        }
    },
    duckPlayerSingle: ({ t, advance, beforeAfter }) => {
        const beforeAfterState = beforeAfter.get()

        return {
            variant: 'box',
            heading: {
                title: t('duckPlayer_title'),
                subtitle: t('duckPlayer_subtitle'),
                speechBubble: true
            },
            dismissButton: {
                startIcon: <Replay />,
                text: beforeAfterState === 'before' ? t('beforeAfter_duckPlayer_show') : t('beforeAfter_duckPlayer_hide'),
                handler: () => beforeAfter.toggle()
            },
            acceptButton: {
                text: t('nextButton'),
                handler: advance
            },
            content: <DuckPlayerStep />
        }
    },
    customize: ({ t, globalState, dismiss }) => {
        const { step, activeRow } = globalState
        const isDone = activeRow >= /** @type {import('../../types').CustomizeStep} */(step).rows.length

        return {
            variant: 'box',
            heading: {
                title: t('customize_title_v3'),
                subtitle: t('customize_subtitle_v3'),
                speechBubble: true
            },
            acceptButton: isDone
                ? {
                    text: t('startBrowsing'),
                    endIcon: <Launch/>,
                    handler: dismiss
                }
                : null,
            content: <CustomizeStep />
        }
    }
}

/**
 * @typedef {object} RowData
 * @property {'one-time' | 'toggle'} kind
 * @property {import('../../types').SystemValueId} id
 * @property {typeof import('../../components/ListItem').availableIcons[number]} icon
 * @property {string} title
 * @property {string} acceptText
 * @property {string} summary
 */

/** @type {Pick<Record<import('../../types').SystemValueId, (t: import('../../types').TranslationFn, platform: ImportMeta['injectName']) => RowData>, 'bookmarks'|'session-restore'|'home-shortcut'>} */
export const settingsRowItems = {
    bookmarks: (t) => ({
        id: 'bookmarks',
        icon: 'v3/favorite.svg',
        title: t('row_bookmarks_title_v3'),
        summary: t('row_bookmarks_summary'),
        kind: 'toggle',
        acceptText: t('row_bookmarks_accept')
    }),
    'session-restore': (t) => ({
        id: 'session-restore',
        icon: 'v3/session-restore.svg',
        title: t('row_session-restore_title_v3'),
        summary: t('row_session-restore_summary'),
        kind: 'toggle',
        acceptText: t('row_session-restore_accept')
    }),
    'home-shortcut': (t) => ({
        id: 'home-shortcut',
        icon: 'v3/home.svg',
        title: t('row_home-shortcut_title_v3'),
        summary: t('row_home-shortcut_summary'),
        kind: 'toggle',
        acceptText: t('row_home-shortcut_accept')
    })
}
