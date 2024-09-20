import { h, Fragment } from 'preact'
import { Launch, Replay } from '../../components/Icons'
import { CustomizeStep } from './CustomizeStep'
import { ImportStep } from './ImportStep'
import { DockStep } from './DockStep'
import { MakeDefaultStep } from './MakeDefaultStep'
import { DuckPlayerStep } from './DuckPlayerStep'

/**
 * @typedef {object} StepConfigParams
 * @property {ReturnType<typeof import('../../types')['useTypedTranslation']>['t']} t
 * @property {ReturnType<typeof import('../../../../../shared/components/EnvironmentProvider').useEnv>} env
 * @property {import('../../types').GlobalState} global
 * @property {() => void} enqueueNext
 * @property {() => void} dismiss
 * @property {(id: import('../../types').SystemValueId) => void} enableSystemValue
 * @property {(value: 'before'|'after') => void} setBeforeAfter
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
    duckPlayerSingle: ({ t, global, setBeforeAfter }) => {
        const { beforeAfterState } = global
        let dismissContent = null
        console.log('BA', beforeAfterState)

        if (beforeAfterState) {
            dismissContent = <>
                <Replay />
                {beforeAfterState === 'before' ? t('beforeAfter_duckPlayer_show') : t('beforeAfter_duckPlayer_hide')}
            </>
        }

        return {
            title: t('duckPlayer_highlights_title'),
            subtitle: t('duckPlayer_highlights_subtitle'),
            dismissContent,
            acceptContent: t('nextButton'),
            dismissHandler: () => setBeforeAfter(beforeAfterState === 'before' ? 'after' : 'before'),
            content: <DuckPlayerStep beforeAfter={beforeAfterState} setBeforeAfter={setBeforeAfter}/>,
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
        const { step, activeRow } = global
        const isDone = activeRow >= /** @type {import('../../types').CustomizeV3Step} */(step).rows.length

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