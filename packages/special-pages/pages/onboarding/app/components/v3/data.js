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
    welcome: ({ t, enqueueNext }) => {
        return {
            variant: 'plain',
            heading: {
                title: t('welcome_title'),
                speechBubble: false,
                children: <Timeout onComplete={enqueueNext} ignore={true} />
            }
        }
    },
    getStarted: ({ t, globalState, enqueueNext }) => {
        const { activeStepVisible } = globalState
        return {
            variant: 'plain',
            heading: {
                title: t('getStarted_highlights_title', { newline: '\n' }),
                speechBubble: true,
                children: activeStepVisible && <ElasticButton onClick={enqueueNext}>{t('getStartedButton_highlights')}</ElasticButton>
            }
        }
    },
    duckPlayerSingle: ({ t, enqueueNext, beforeAfter }) => {
        const beforeAfterState = beforeAfter.get()

        return {
            variant: 'box',
            heading: {
                title: t('duckPlayer_highlights_title'),
                subtitle: t('duckPlayer_highlights_subtitle'),
                speechBubble: true
            },
            dismissButton: (beforeAfterState && {
                startIcon: <Replay />,
                text: beforeAfterState === 'before' ? t('beforeAfter_duckPlayer_show') : t('beforeAfter_duckPlayer_hide'),
                handler: () => beforeAfter.toggle()
            }) || null,
            acceptButton: {
                text: t('nextButton'),
                handler: enqueueNext
            },
            content: <DuckPlayerStep />
        }
    },
    importSingle: ({ t, globalState, enqueueNext, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues.import === 'idle'

        return {
            variant: 'box',
            heading: {
                title: t('import_highlights_title'),
                subtitle: t('import_highlights_subtitle'),
                speechBubble: true
            },
            dismissButton: (isIdle && {
                text: t('skipButton'),
                handler: enqueueNext
            }) || null,
            acceptButton: isIdle
                ? {
                    text: t('importButton'),
                    handler: () => enableSystemValue('import')
                }
                : {
                    text: t('nextButton'),
                    handler: enqueueNext
                },
            content: <ImportStep />
        }
    },
    makeDefaultSingle: ({ t, globalState, enqueueNext, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues['default-browser'] === 'idle'

        return {
            variant: 'box',
            heading: {
                title: isIdle ? t('protectionsActivated') : t('makeDefaultSuccess'),
                speechBubble: true
            },
            dismissButton: (isIdle && {
                text: t('skipButton'),
                handler: enqueueNext
            }) || null,
            acceptButton: isIdle
                ? {
                    text: t('makeDefaultButton'),
                    handler: () => enableSystemValue('default-browser')
                }
                : {
                    text: t('nextButton'),
                    handler: enqueueNext
                },
            content: <MakeDefaultStep />
        }
    },
    customize: ({ t, globalState, dismiss }) => {
        const { step, activeRow } = globalState
        const isDone = activeRow >= /** @type {import('../../types').CustomizeStep} */(step).rows.length

        return {
            variant: 'box',
            heading: {
                title: t('customize_highlights_title'),
                subtitle: t('customize_highlights_subtitle'),
                speechBubble: true
            },
            acceptButton: (isDone && {
                text: t('startBrowsing'),
                endIcon: <Launch/>,
                handler: dismiss
            }) || null,
            content: <CustomizeStep />
        }
    },
    dockSingle: ({ t, env, globalState, enqueueNext, enableSystemValue }) => {
        const { UIValues } = globalState
        const isIdle = UIValues.dock === 'idle'
        const { injectName: platform } = env

        let title = isIdle ? t('stickAroundDockTitle') : t('dockAcceptTitle', { newline: '\n' })
        let idleButtonText = t('keepInDockButton')

        if (platform === 'windows') {
            title = isIdle ? t('stickAroundTaskbarTitle') : t('taskbarAcceptTitle', { newline: '\n' })
            idleButtonText = t('nextButton')
        }

        return {
            variant: 'box',
            heading: {
                title,
                subtitle: isIdle ? t('dockSubtitle') : null,
                speechBubble: true
            },
            dismissButton: platform !== 'windows' && isIdle
                ? {
                    text: t('skipButton'),
                    handler: enqueueNext
                }
                : null,
            acceptButton: isIdle
                ? {
                    text: idleButtonText,
                    handler: () => enableSystemValue('dock')
                }
                : {
                    text: t('nextButton'),
                    handler: enqueueNext
                },
            content: <DockStep />
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
        title: t('bookmarksBar'),
        summary: t('row_bookmarks_summary'),
        kind: 'toggle',
        acceptText: t('row_bookmarks_accept')
    }),
    'session-restore': (t) => ({
        id: 'session-restore',
        icon: 'v3/session-restore.svg',
        title: t('restoreSession'),
        summary: t('row_session-restore_summary'),
        kind: 'toggle',
        acceptText: t('row_session-restore_accept')
    }),
    'home-shortcut': (t) => ({
        id: 'home-shortcut',
        icon: 'v3/home.svg',
        title: t('addHomeShortcut'),
        summary: t('row_home-shortcut_summary'),
        kind: 'toggle',
        acceptText: t('row_home-shortcut_accept')
    })
}
