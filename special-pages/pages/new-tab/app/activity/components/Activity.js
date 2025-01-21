import { h } from 'preact';
import styles from './Activity.module.css';
import { useTypedTranslationWith } from '../../types.js';
import { useContext, useId, useCallback } from 'preact/hooks';
import { ActivityContext, ActivityProvider } from '../ActivityProvider.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { viewTransition } from '../../utils.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useCustomizerDrawerSettings } from '../../settings.provider.js';
import { Heading } from '../../privacy-stats/components/PrivacyStats.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {import('../../../types/new-tab').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../types/new-tab').ActivityData} ActivityData
 * @typedef {import('../../../types/new-tab').ActivityConfig} ActivityConfig
 * @typedef {import("../ActivityProvider.js").Events} Events
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {ActivityData} props.data
 * @param {()=>void} props.toggle
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function Activity({ expansion, data, toggle, animation = 'auto-animate' }) {
    if (animation === 'view-transitions') {
        return <WithViewTransitions data={data} expansion={expansion} toggle={toggle} />;
    }

    // no animations
    return <ActivityConfigured expansion={expansion} data={data} toggle={toggle} />;
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {ActivityData} props.data
 * @param {()=>void} props.toggle
 */
function WithViewTransitions({ expansion, data, toggle }) {
    const willToggle = useCallback(() => {
        viewTransition(toggle);
    }, [toggle]);
    return <ActivityConfigured expansion={expansion} data={data} toggle={willToggle} />;
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.parentRef]
 * @param {Expansion} props.expansion
 * @param {ActivityData} props.data
 * @param {()=>void} props.toggle
 */
function ActivityConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === 'expanded';
    const recent = 100;
    const canExpand = false;

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    return (
        <div class={styles.root} ref={parentRef}>
            <Heading
                recent={recent}
                onToggle={toggle}
                expansion={expansion}
                canExpand={canExpand}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID,
                }}
            />
        </div>
    );
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function ActivityCustomized() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const drawer = useCustomizerDrawerSettings();

    /**
     * The menu title for the stats widget is changes when the menu is in the sidebar.
     */
    // prettier-ignore
    const sectionTitle = drawer.state === 'enabled'
        ? t('activity_menuTitle_v2')
        : t('activity_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'shield', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <ActivityProvider>
            <ActivityConsumer />
        </ActivityProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <ActivityProvider>
 *     <ActivityConsumer />
 * </ActivityProvider>
 * ```
 */
export function ActivityConsumer() {
    const { state, toggle } = useContext(ActivityContext);
    if (state.status === 'ready') {
        return <Activity expansion={state.config.expansion} animation={state.config.animation?.kind} data={state.data} toggle={toggle} />;
    }
    return null;
}
