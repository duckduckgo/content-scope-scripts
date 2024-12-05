import { h } from 'preact';
import cn from 'classnames';
import { useCallback, useContext, useId } from 'preact/hooks';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useCustomizer } from '../../customizer/components/Customizer.js';
import { useTypedTranslationWith } from '../../types.js';
import { viewTransition } from '../../utils.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { PrivacyProContext, PrivacyProProvider } from '../PrivacyProProvider.js';
import styles from './PrivacyPro.module.css';
import { Button } from '../../../../../shared/components/Button/Button.js';

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
 * @param {(id: string)=>void} props.action
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function PrivacyPro({ expansion, data, toggle, animation = 'auto-animate', action }) {
    if (animation === 'view-transitions') {
        return <WithViewTransitions data={data} expansion={expansion} toggle={toggle} action={action} />;
    }

    // no animations
    return <PrivacyProConfigured expansion={expansion} data={data} toggle={toggle} action={action} />;
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyProData} props.data
 * @param {()=>void} props.toggle
 * @param {(id: string)=>void} props.action
 */
function WithViewTransitions({ expansion, data, toggle, action }) {
    const willToggle = useCallback(() => {
        viewTransition(toggle);
    }, [toggle]);
    return <PrivacyProConfigured expansion={expansion} data={data} toggle={willToggle} action={action} />;
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.parentRef]
 * @param {Expansion} props.expansion
 * @param {PrivacyProData} props.data
 * @param {()=>void} props.toggle
 * @param {(id: string)=>void} props.action
 */
function PrivacyProConfigured({ parentRef, expansion, data, toggle, action }) {
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
                action={action}
            />
            {expanded && <PrivacyProBody data={data} action={action} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {() => void} props.onToggle
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 * @param {(id: string) => void} props.action
 */
export function Heading({ expansion, onToggle, buttonAttrs = {}, action }) {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const notASubscriber = null;
    return (
        <div className={styles.heading}>
            <span className={styles.headingIcon}>
                <img src="./icons/PrivacyPro.svg" alt="Privacy Shield" />
            </span>
            <h2 className={styles.title}>{t('privacyPro_widgetTitle')}</h2>
            <div class={cn(styles.buttonBlock, expansion === 'collapsed' && styles.visible)}>
                <Button className={styles.headingBtn} variant="standard" onClick={() => action('personalInformationRemoval')}>
                    <p class="sr-only">Personal Information Removal</p>
                    <img src="./icons/Identity-Blocked-PIR-Color-16.svg" alt="Personal Information Removal" />
                </Button>
                <Button className={styles.headingBtn} variant="standard" onClick={() => action('vpn')}>
                    <p class="sr-only">VPN</p>

                    <img src="./icons/VPN-Color-16.svg" alt="VPN" />
                </Button>
                <Button className={styles.headingBtn} variant="standard" onClick={() => action('identityRestoration')}>
                    <p class="sr-only">Identity Restoration</p>

                    <img src="./icons/ID-32.svg" alt="Identity Restoration" />
                </Button>
            </div>
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
 * @param {(id: string) => void} props.action
 */

export function PrivacyProBody({ data, action }) {
    return (
        <div class={styles.body}>
            {data.personalInformationRemoval && (
                <button class={styles.panelButton} onClick={() => action('personalInformationRemoval')}>
                    <div class={styles.topSection}>
                        <img src="./icons/Information-Remover-32.svg" alt="Privacy Shield" />
                        <p>Information Removal</p>
                    </div>
                    <div class={styles.middleSection}>
                        <p>Next Scan</p>
                        <p>DATE</p>
                    </div>
                    <div class={styles.bottomSection}>
                        <span class={styles.statusDot}></span>
                        <p>In Progress</p>
                    </div>
                </button>
            )}
            {data.vpn && (
                <button class={styles.panelButton} onClick={() => action('vpn')}>
                    <div class={styles.topSection}>
                        <img src="./icons/VPN-Color-32.svg" alt="Privacy Shield" />
                        <p>VPN</p>
                    </div>
                    <div class={styles.middleSection}>
                        <p>Location</p>
                        <p>United Kingdom</p>
                    </div>
                    <div class={styles.bottomSection}>
                        <span class={styles.statusDot}></span>
                        <p>ON</p>
                    </div>
                </button>
            )}
            {data.identityRestoration && (
                <button class={styles.panelButton} onClick={() => action('identityRestoration')}>
                    <div class={styles.topSection}>
                        <img src="./icons/ID-32.svg" alt="Privacy Shield" />
                        <p>Identity Restoration</p>
                    </div>
                    <div class={styles.middleSection}>
                        <p>Covered since</p>
                        <p>DATE</p>
                    </div>
                    <div class={styles.bottomSection}>
                        <span class={styles.statusDot}></span>
                        <p>Available</p>
                    </div>
                </button>
            )}
        </div>
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
    const { state, toggle, action } = useContext(PrivacyProContext);
    if (state.status === 'ready') {
        return (
            <PrivacyPro
                expansion={state.config.expansion}
                animation={state.config.animation?.kind}
                data={state.data}
                toggle={toggle}
                action={action}
            />
        );
    }
    return null;
}
