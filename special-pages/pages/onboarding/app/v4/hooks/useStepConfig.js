import { useContext } from 'preact/hooks';
import { GlobalContext, GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { usePlatformName } from '../../shared/components/SettingsProvider';
import { stepsConfig } from '../data/data';
import { useMediaQuery } from '../../../../../shared/hooks/useMediaQuery.js';

/**
 * @param {import('../../types').Step['id'][]} order
 * @param {import('../../types').Step['id']} activeStep
 * @returns {import('../data/data-types').Progress}
 */
function calculateProgress(order, activeStep) {
    // Skip 'welcome' and 'getStarted' — they don't show the progress indicator
    const progressSteps = order.slice(2);

    return {
        current: progressSteps.indexOf(activeStep) + 1,
        total: progressSteps.length,
    };
}

/**
 *
 * @returns {import('../data/data-types').StepData}
 */
export function useStepConfig() {
    const globalState = useContext(GlobalContext);
    const platformName = usePlatformName() || 'macos';
    const isShortViewport = useMediaQuery('(max-height: 549px)');
    const dispatch = useContext(GlobalDispatch);
    const { t } = useTypedTranslation();

    const { order, activeStep } = globalState;

    const progress = calculateProgress(order, activeStep);

    const advance = () => {
        dispatch({ kind: 'advance' });
    };

    const enqueueNext = () => dispatch({ kind: 'enqueue-next' });
    const dismiss = () => dispatch({ kind: 'dismiss' });

    /** @type {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} */
    const updateSystemValue = (id, payload, current) =>
        dispatch({
            kind: 'update-system-value',
            id,
            payload,
            current,
        });

    /** @type {import('../data/data-types').StepConfigParams} */
    const configParams = {
        t,
        platformName,
        globalState,
        progress,
        advance,
        enqueueNext,
        dismiss,
        updateSystemValue,
        isShortViewport,
    };

    if (!stepsConfig[activeStep]) {
        throw new Error(`Missing step config for ${activeStep}`);
    }

    return {
        ...configParams,
        ...stepsConfig[activeStep](configParams),
    };
}
