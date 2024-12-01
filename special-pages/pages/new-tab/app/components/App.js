import { h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useCustomizerDrawerSettings, usePlatformName } from '../settings.provider.js';
import { WidgetList } from '../widget-list/WidgetList.js';
import { useGlobalDropzone } from '../dropzone.js';
import { Customizer, CustomizerButton, CustomizerMenuPositionedFixed, useContextMenu } from '../customizer/components/Customizer.js';
import { useDrawer, useDrawerControls } from './Drawer.js';
import { CustomizerDrawer } from '../customizer/components/CustomizerDrawer.js';

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

    const { buttonRef, wrapperRef, visibility, displayChildren, hidden, buttonId, drawerId } = useDrawer();
    const { toggle, close } = useDrawerControls();

    return (
        <div class={cn(styles.layout)} ref={wrapperRef} data-drawer-visibility={visibility}>
            <main class={cn(styles.main)}>
                <div class={styles.tube} data-platform={platformName}>
                    <WidgetList />
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
                    {children}
                </div>
            </main>
            {customizerKind === 'drawer' && (
                <aside id={drawerId} class={styles.aside} aria-hidden={hidden}>
                    <div class={styles.asideContent}>
                        <CustomizerDrawer onClose={close} wrapperRef={wrapperRef} displayChildren={displayChildren} />
                    </div>
                </aside>
            )}
        </div>
    );
}
