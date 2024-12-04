import { h, Fragment } from 'preact';
import cn from 'classnames';

import { values } from '../values.js';
import styles from './CustomizerDrawerInner.module.css';
import { CircleCheck } from '../../components/Icons.js';
import { computed } from '@preact/signals';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(target: 'color' | 'back' | 'image' | 'gradient') => void} props.onNav
 * @param {() => void} props.onUpload
 */
export function BackgroundSection({ data, onNav, onUpload }) {
    console.log('    RENDER:BackgroundSection?');
    const color = values.colors.color11;
    const gradient = values.gradients.gradient02;

    return (
        <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Background</h3>
            <ul class={cn(styles.sectionBody, styles.bgList)}>
                <li class={styles.bgListItem}>
                    <DefaultPanel />
                </li>
                <li class={styles.bgListItem}>
                    <ColorPanel color={color} onClick={() => onNav('color')} />
                </li>
                <li class={styles.bgListItem}>
                    <GradientPanel gradient={gradient} onClick={() => onNav('gradient')} />
                </li>
                <li class={styles.bgListItem}>
                    <BackgroundImagePanel onClick={() => onNav('image')} data={data} upload={onUpload} />
                </li>
            </ul>
        </div>
    );
}

function DefaultPanel() {
    return (
        <>
            <button class={cn(styles.bgPanel, styles.bgPanelEmpty)}>
                <CircleCheck />
            </button>
            Default
        </>
    );
}

/**
 * @param {object} props
 * @param {() => void} props.onClick
 * @param {typeof values.colors[keyof typeof values.colors]} props.color
 */
function ColorPanel(props) {
    return (
        <>
            <button class={styles.bgPanel} onClick={props.onClick} style={{ background: props.color.hex }}></button>
            Solid Colors
        </>
    );
}

/**
 * @param {object} props
 * @param {() => void} props.onClick
 * @param {typeof values.gradients[keyof typeof values.gradients]} props.gradient
 */
function GradientPanel(props) {
    return (
        <>
            <button
                onClick={props.onClick}
                class={styles.bgPanel}
                style={{
                    background: `url(${props.gradient.path})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                }}
            ></button>
            Gradients
        </>
    );
}

/**
 * @param {object} props
 * @param {() => void} props.onClick
 * @param {() => void} props.upload
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 */
function BackgroundImagePanel(props) {
    const empty = computed(() => props.data.value.userImages.length === 0);
    const selectedImage = computed(() => {
        const imageId = props.data.value.background.kind === 'userImage' ? props.data.value.background.value : null;
        if (imageId !== null) {
            const match = props.data.value.userImages.find((i) => i.id === imageId.id);
            if (match) {
                return match;
            }
        }
        return null;
    });

    const firstImage = computed(() => {
        return props.data.value.userImages[0] ?? null;
    });

    if (empty.value === true) {
        return (
            <Fragment>
                <button class={cn(styles.bgPanel, styles.bgPanelEmpty)} onClick={props.upload}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M8.25 0.5C8.66421 0.5 9 0.835786 9 1.25V7H14.75C15.1642 7 15.5 7.33579 15.5 7.75C15.5 8.16421 15.1642 8.5 14.75 8.5H9V14.25C9 14.6642 8.66421 15 8.25 15C7.83579 15 7.5 14.6642 7.5 14.25V8.5H1.75C1.33579 8.5 1 8.16421 1 7.75C1 7.33579 1.33579 7 1.75 7H7.5V1.25C7.5 0.835786 7.83579 0.5 8.25 0.5Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
                Add Background
            </Fragment>
        );
    }

    if (selectedImage.value !== null) {
        return (
            <Fragment>
                <button
                    class={cn(styles.bgPanel)}
                    onClick={props.onClick}
                    style={{
                        backgroundImage: `url(${selectedImage.value?.thumb})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                ></button>
                My Backgrounds
            </Fragment>
        );
    }

    return (
        <Fragment>
            <button
                class={cn(styles.bgPanel)}
                onClick={props.onClick}
                style={{
                    backgroundImage: `url(${firstImage.value?.thumb})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                }}
            ></button>
            My Backgrounds
        </Fragment>
    );
}
