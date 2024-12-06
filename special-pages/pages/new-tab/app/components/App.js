import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useCustomizerDrawerSettings, usePlatformName } from '../settings.provider.js';
import { WidgetList } from '../widget-list/WidgetList.js';
import { useGlobalDropzone } from '../dropzone.js';
import { Customizer, CustomizerButton, CustomizerMenuPositionedFixed, useContextMenu } from '../customizer/components/Customizer.js';
import { useDrawer, useDrawerControls } from './Drawer.js';
import { CustomizerDrawer } from '../customizer/components/CustomizerDrawer.js';
import { BackgroundConsumer, BackgroundProvider } from './BackgroundProvider.js';
import { useThemes } from './ThemeManager.js';

/**
 * Renders the App component.
 *
 * @param {Object} props - The properties of the component.
 * @param {import("preact").ComponentChild} [props.children] - The child components to be rendered within the App component.
 */
export function App({ children }) {
    const platformName = usePlatformName();
    const settings = useCustomizerDrawerSettings();

    const customizerKind = settings.state === 'enabled' ? 'drawer' : 'menu';

    useGlobalDropzone();
    useContextMenu();

    const { buttonRef, wrapperRef, visibility, displayChildren, animating, hidden, buttonId, drawerId } = useDrawer();
    const { toggle } = useDrawerControls();
    const { bg, browser } = useThemes();

    return (
        <Fragment>
            {customizerKind === 'drawer' && (
                <BackgroundProvider>
                    <BackgroundConsumer />
                </BackgroundProvider>
            )}
            <div class={styles.layout} ref={wrapperRef} data-animating={animating} data-drawer-visibility={visibility}>
                <main class={cn(styles.main, styles.mainScroller)} data-main-scroller data-theme={bg}>
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
                    <div class={styles.content}>
                        <div className={styles.tube} data-platform={platformName}>
                            <WidgetList />
                        </div>
                    </div>
                </main>
                {customizerKind === 'drawer' && (
                    <aside class={cn(styles.aside, styles.asideScroller)} aria-hidden={hidden} data-theme={browser} data-browser-panel>
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
