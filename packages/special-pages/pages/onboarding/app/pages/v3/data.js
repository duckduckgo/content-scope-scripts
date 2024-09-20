import { h, Fragment } from 'preact'
import { Launch } from '../../components/Icons'
import { CustomizeStep } from './CustomizeStep'
import { ImportStep } from './ImportStep'
import { DockStep } from './DockStep'
import { MakeDefaultStep } from './MakeDefaultStep'

/**
 * @typedef {object} StepConfigParams
 * @property {ReturnType<typeof import('../../types')['useTypedTranslation']>['t']} t
 * @property {ReturnType<typeof import('../../../../../shared/components/EnvironmentProvider').useEnv>} env
 * @property {import('../../types').GlobalState} global
 * @property {() => void} enqueueNext
 * @property {() => void} dismiss
 * @property {(id: import('../../types').SystemValueId) => void} enableSystemValue
 */

/**
 * @typedef {object} StepConfig
 * @property {string|null} title
 * @property {string|null} [subtitle]
 * @property {import('preact').ComponentChild} [dismissContent]
 * @property {import('preact').ComponentChild} [acceptContent]
 * @property {(() => void)|null} [dismissHandler]
 * @property {(() => void)|null} [acceptHandler]
 * @property {import('preact').ComponentChild} content
 */

/** @type {Partial<Record<import('../../types').Step['id'], (params: StepConfigParams) => StepConfig>>} */
export const stepsConfig = {
    duckPlayerSingle: ({ t }) => {
        return {
            title: t('duckPlayer_highlights_title'),
            subtitle: t('duckPlayer_highlights_subtitle')
        }
    },
    importSingle: ({ t, global, enableSystemValue }) => {
        const { UIValues } = global
        const isIdle = UIValues.import === 'idle'

        return {
            title: t('import_highlights_title'),
            subtitle: t('import_highlights_subtitle'),
            dismissContent: isIdle ? t('skipButton') : null,
            acceptContent: isIdle ? t('importButton') : t('nextButton'),
            acceptHandler: isIdle ? () => enableSystemValue('import') : null,
            content: <ImportStep />
        }
    },
    makeDefaultSingle: ({ t, global, enableSystemValue }) => {
        const { UIValues } = global
        const isIdle = UIValues['default-browser'] === 'idle'

        return {
            title: isIdle ? t('protectionsActivated') : t('makeDefaultSuccess'),
            subtitle: null,
            dismissContent: isIdle ? t('skipButton') : null,
            acceptContent: isIdle ? t('makeDefaultButton') : t('nextButton'),
            acceptHandler: isIdle ? () => enableSystemValue('default-browser') : null,
            content: <MakeDefaultStep />
        }
    },
    customizeV3: ({ t, global, dismiss }) => {
        const { step, activeStep, activeRow } = global
        const isDone = activeRow >= step.rows.length

        return {
            title: t('customize_highlights_title'),
            subtitle: t('customize_highlights_subtitle'),
            acceptContent: isDone ? <>{t('startBrowsing')}<Launch/></> : null,
            acceptHandler: isDone ? dismiss : null,
            content: <CustomizeStep />
        }
    },
    dockSingle: ({ t, env, global, enableSystemValue }) => {
        const { UIValues } = global
        const isIdle = UIValues['dock'] === 'idle'
        const { injectName: platform } = env

        let title = isIdle ? t('stickAroundDockTitle') : t('dockAcceptTitle', { newline: '\n' })
        let idleButtonContent = t('keepInDockButton')

        if (platform === 'windows') {
            title = isIdle ? t('stickAroundTaskbarTitle') : t('taskbarAcceptTitle', { newline: '\n' })
            idleButtonContent = t('nextButton')
        }

        return {
            title,
            subtitle: isIdle ? t('dockSubtitle') : null,
            dismissContent: platform !== 'windows' && isIdle ? t('skipButton') : null,
            acceptContent: isIdle ? idleButtonContent : t('nextButton'),
            acceptHandler: isIdle ? () => enableSystemValue('dock') : null,
            content: <DockStep />
        }
    }
}