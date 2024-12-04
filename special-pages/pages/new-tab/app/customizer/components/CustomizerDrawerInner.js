import { h } from 'preact';
import cn from 'classnames';
import styles from './CustomizerDrawerInner.module.css';
import { useDrawerControls } from '../../components/Drawer.js';
import { BackgroundSection } from './BackgroundSection.js';
import { BrowserThemeSection } from './BrowserThemeSection.js';
import { VisibilityMenuSection } from './VisibilityMenuSection.js';
import { ColorSelection } from './ColorSelection.js';
import { useRef } from 'preact/hooks';
import { GradientSelection } from './GradientSelection.js';
import { useSignal } from '@preact/signals';
import { ImageSelection } from './ImageSelection.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: CustomizerData['background']) => void} props.select
 * @param {() => void} props.onUpload
 * @param {(theme: import('../../../types/new-tab').CustomizerData['theme']) => void} props.setTheme
 * @param {(id: string) => void} props.deleteImage
 */
export function CustomizerDrawerInner({ data, select, onUpload, setTheme, deleteImage }) {
    console.log('  RENDER:CustomizerDrawerInner?');
    const { close } = useDrawerControls();
    const ref = useRef(/** @type {any} */ (null));
    const state = useSignal('home');
    function onNav(nav) {
        const curr = ref.current;
        if (!curr) return;
        if (ref.current instanceof HTMLDivElement) {
            ref.current.style.gridTemplateAreas = "'col2 col1'";
        }
        state.value = nav;
    }
    function back() {
        ref.current.style.gridTemplateAreas = "'col1 col2'";
        state.value = 'home';
    }
    return (
        <div class={styles.root}>
            <header class={styles.header}>
                <h2>Customize</h2>
                <button onClick={close}>Close</button>
            </header>
            <div class={styles.cols} ref={ref}>
                <div class={cn(styles.col, styles.col1, styles.mainSections)}>
                    <BackgroundSection data={data} onNav={onNav} onUpload={onUpload} />
                    <BrowserThemeSection data={data} setTheme={setTheme} />
                    <VisibilityMenuSection />
                </div>
                <div class={cn(styles.col, styles.col2)}>
                    {state.value === 'color' && <ColorSelection data={data} select={select} back={back} />}
                    {state.value === 'gradient' && <GradientSelection data={data} select={select} back={back} />}
                    {state.value === 'image' && (
                        <ImageSelection data={data} select={select} back={back} onUpload={onUpload} deleteImage={deleteImage} />
                    )}
                </div>
            </div>
        </div>
    );
}
