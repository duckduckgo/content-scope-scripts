import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useCustomizerDrawerSettings, usePlatformName } from '../settings.provider.js';
import { WidgetList } from '../widget-list/WidgetList.js';
import { useGlobalDropzone } from '../dropzone.js';
import { Customizer, CustomizerButton, CustomizerMenuPositionedFixed, useContextMenu } from '../customizer/components/Customizer.js';
import { useDrawer, useDrawerControls } from './Drawer.js';
import { CustomizerDrawer } from '../customizer/components/CustomizerDrawer.js';
import { BackgroundConsumer } from './BackgroundProvider.js';
import { useComputed } from '@preact/signals';
import { CustomizerThemesContext } from '../customizer/CustomizerProvider.js';
import { useContext } from 'preact/hooks';

/**
 * Renders the App component.
 *
 * @param {Object} props - The properties of the component.
 * @param {import("preact").ComponentChild} [props.children] - The child components to be rendered within the App component.
 */
export function App() {
    const platformName = usePlatformName();
    const customizerDrawer = useCustomizerDrawerSettings();

    const customizerKind = customizerDrawer.state === 'enabled' ? 'drawer' : 'menu';

    useGlobalDropzone();
    useContextMenu();

    // prettier-ignore
    const {
        buttonRef,
        wrapperRef,
        visibility,
        displayChildren,
        animating,
        hidden,
        buttonId,
        drawerId
    } = useDrawer();

    const tabIndex = useComputed(() => (hidden.value ? -1 : 0));
    const { toggle } = useDrawerControls();
    const { main, browser } = useContext(CustomizerThemesContext);

    return (
        <Fragment>
            <BackgroundConsumer browser={browser} bg={main} />
            <div class={styles.layout} ref={wrapperRef} data-animating={animating} data-drawer-visibility={visibility}>
                <main class={cn(styles.main, styles.mainScroller)} data-main-scroller data-theme={main}>
                    <div class={styles.content}>
                        <div className={styles.tube} data-content-tube data-platform={platformName}>
                            <WidgetList />
                        </div>
                    </div>
                    <CustomizerMenuPositionedFixed>
                        {customizerKind === 'menu' && <Customizer />}
                        {customizerKind === 'drawer' && (
                            <CustomizerButton
                                buttonId={buttonId}
                                menuId={drawerId}
                                toggleMenu={toggle}
                                buttonRef={buttonRef}
                                isOpen={false}
                            />
                        )}
                    </CustomizerMenuPositionedFixed>
                </main>
                {customizerKind === 'drawer' && (
                    <aside
                        class={cn(styles.aside, styles.asideScroller)}
                        tabindex={tabIndex}
                        aria-hidden={hidden}
                        data-theme={browser}
                        data-browser-panel
                    >
                        <div class={styles.asideContent}>
                            <div class={styles.asideContentInner}>
                                <CustomizerDrawer displayChildren={displayChildren} />
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </Fragment>
    );
}
