import { Fragment, h } from 'preact';
import { useCallback, useContext, useId } from 'preact/hooks';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useCustomizer } from '../../customizer/components/Customizer.js';
import { useTypedTranslationWith } from '../../types.js';
import { viewTransition } from '../../utils.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { PrivacyProContext, PrivacyProProvider } from '../PrivacyProProvider.js';
import styles from './PrivacyPro.module.css';

/**
 * @import enStrings from "../strings.json"
 * @typedef {import('../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../types/new-tab').PrivacyProData} PrivacyProData
 * @typedef {import('../../../types/new-tab').PrivacyProConfig} PrivacyProConfig
 * @typedef {import("../PrivacyProProvider.js").Events} Events
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyProData} props.data
 * @param {()=>void} props.toggle
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function PrivacyPro({ expansion, data, toggle, animation = 'auto-animate' }) {
    if (animation === 'view-transitions') {
        return <WithViewTransitions data={data} expansion={expansion} toggle={toggle} />;
    }

    // no animations
    return <PrivacyProConfigured expansion={expansion} data={data} toggle={toggle} />;
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyProData} props.data
 * @param {()=>void} props.toggle
 */
function WithViewTransitions({ expansion, data, toggle }) {
    const willToggle = useCallback(() => {
        viewTransition(toggle);
    }, [toggle]);
    return <PrivacyProConfigured expansion={expansion} data={data} toggle={willToggle} />;
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.parentRef]
 * @param {Expansion} props.expansion
 * @param {PrivacyProData} props.data
 * @param {()=>void} props.toggle
 */
function PrivacyProConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === 'expanded';

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    return (
        <div class={styles.root} ref={parentRef}>
            <Heading
                onToggle={toggle}
                expansion={expansion}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID,
                }}
            />
            {expanded && <PrivacyProBody data={data} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {() => void} props.onToggle
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function Heading({ expansion, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const notASubscriber = null;
    return (
        <div className={styles.heading}>
            <span className={styles.headingIcon}>
                <img src="./icons/PrivacyPro.svg" alt="Privacy Shield" />
            </span>
            <h2 className={styles.title}>{t('privacyPro_widgetTitle')}</h2>

            <span className={styles.widgetExpander}>
                <ShowHideButton
                    buttonAttrs={{
                        ...buttonAttrs,
                        'aria-expanded': expansion === 'expanded',
                        'aria-pressed': expansion === 'expanded',
                    }}
                    onClick={onToggle}
                    text={expansion === 'expanded' ? t('ntp_show_less') : t('ntp_show_more')}
                    shape="round"
                />
            </span>

            {notASubscriber && <p className={styles.subtitle}>{t('privacyPro_nonsubscriber_subtext')}</p>}
        </div>
    );
}

/**
 * @param {object} props
 * @param {PrivacyProData} props.data
 * @param {import("preact").ComponentProps<'ul'>} [props.listAttrs]
 */

export function PrivacyProBody({ data }) {
    return (
        <Fragment>
            <h1>Privacy PRo widget bodys</h1>
        </Fragment>
    );
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function PrivacyProCustomized() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const { visibility, id, toggle, index } = useVisibility();

    const title = t('privacyPro_menuTitle');
    useCustomizer({ title, id, icon: 'shield', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <PrivacyProProvider>
            <PrivacyProConsumer />
        </PrivacyProProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <PrivacyProProvider>
 *     <PrivacyProConsumer />
 * </PrivacyProProvider>
 * ```
 */
export function PrivacyProConsumer() {
    const { state, toggle } = useContext(PrivacyProContext);
    if (state.status === 'ready') {
        return <PrivacyPro expansion={state.config.expansion} animation={state.config.animation?.kind} data={state.data} toggle={toggle} />;
    }
    return null;
}
