import { h } from 'preact';
import styles from './CustomizerDrawerInner.module.css';
import { useDrawerControls } from '../../components/Drawer.js';
import { BackgroundSection } from './BackgroundSection.js';
import { BrowserThemeSection } from './BrowserThemeSection.js';
import { VisibilityMenuSection } from './VisibilityMenuSection.js';
import { ColorSelection } from './ColorSelection.js';
import { GradientSelection } from './GradientSelection.js';
import { useSignal } from '@preact/signals';
import { ImageSelection } from './ImageSelection.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData, BackgroundData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(bg: BackgroundData) => void} props.select
 * @param {() => void} props.onUpload
 * @param {(theme: import('../../../types/new-tab').ThemeData) => void} props.setTheme
 * @param {(id: string) => void} props.deleteImage
 */
export function CustomizerDrawerInner({ data, select, onUpload, setTheme, deleteImage }) {
    const { close } = useDrawerControls();
    const state = useSignal('home');
    function onNav(nav) {
        state.value = nav;
    }
    function back() {
        state.value = 'home';
    }
    return (
        <div class={styles.root}>
            <header class={styles.header}>
                <h2>Customize</h2>
                <button onClick={close}>Close</button>
            </header>
            {state.value === 'home' && <BackgroundSection data={data} onNav={onNav} onUpload={onUpload} select={select} />}
            {state.value === 'home' && <BrowserThemeSection data={data} setTheme={setTheme} />}
            {state.value === 'home' && <VisibilityMenuSection />}
            {state.value === 'color' && <ColorSelection data={data} select={select} back={back} />}
            {state.value === 'gradient' && <GradientSelection data={data} select={select} back={back} />}
            {state.value === 'image' && (
                <ImageSelection data={data} select={select} back={back} onUpload={onUpload} deleteImage={deleteImage} />
            )}
        </div>
    );
}
