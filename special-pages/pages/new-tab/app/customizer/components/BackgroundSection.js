import { h, Fragment } from 'preact';
import cn from 'classnames';

import { values } from '../values.js';
import styles from './CustomizerDrawerInner.module.css';
import { CircleCheck, PlusIcon } from '../../components/Icons.js';
import { computed } from '@preact/signals';
import { useId } from 'preact/hooks';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {(bg: CustomizerData['background']) => void} props.select
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 * @param {(target: 'color' | 'back' | 'image' | 'gradient') => void} props.onNav
 * @param {() => void} props.onUpload
 */
export function BackgroundSection({ data, onNav, onUpload, select }) {
    console.log('    RENDER:BackgroundSection?');
    const color = values.colors.color11;
    const gradient = values.gradients.gradient02;

    return (
        <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Background</h3>
            <ul class={cn(styles.sectionBody, styles.bgList)} role="radiogroup">
                <li class={styles.bgListItem}>
                    <DefaultPanel checked={data.value.background.kind === 'default'} onClick={() => select({ kind: 'default' })} />
                </li>
                <li class={styles.bgListItem}>
                    <ColorPanel checked={data.value.background.kind === 'color'} color={color} onClick={() => onNav('color')} />
                </li>
                <li class={styles.bgListItem}>
                    <GradientPanel
                        checked={data.value.background.kind === 'gradient'}
                        gradient={gradient}
                        onClick={() => onNav('gradient')}
                    />
                </li>
                <li class={styles.bgListItem}>
                    <BackgroundImagePanel
                        checked={data.value.background.kind === 'userImage'}
                        onClick={() => onNav('image')}
                        data={data}
                        upload={onUpload}
                    />
                </li>
            </ul>
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {() => void} props.onClick
 */
function DefaultPanel({ checked, onClick }) {
    const id = useId();
    return (
        <>
            <button
                class={cn(styles.bgPanel, styles.bgPanelEmpty)}
                aria-checked={checked}
                aria-labelledby={id}
                role="radio"
                onClick={onClick}
            >
                {checked && <CircleCheck />}
            </button>
            <span id={id}>Default</span>
        </>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {() => void} props.onClick
 * @param {typeof values.colors[keyof typeof values.colors]} props.color
 */
function ColorPanel(props) {
    const id = useId();
    return (
        <>
            <button
                class={styles.bgPanel}
                onClick={props.onClick}
                aria-checked={props.checked}
                aria-labelledby={id}
                role="radio"
                style={{ background: props.color.hex }}
            >
                {props.checked && <CircleCheck />}
            </button>
            <span id={id}>Solid Colors</span>
        </>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {() => void} props.onClick
 * @param {typeof values.gradients[keyof typeof values.gradients]} props.gradient
 */
function GradientPanel(props) {
    const id = useId();
    return (
        <>
            <button
                onClick={props.onClick}
                class={styles.bgPanel}
                aria-checked={props.checked}
                aria-labelledby={id}
                style={{
                    background: `url(${props.gradient.path})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                }}
            >
                {props.checked && <CircleCheck />}
            </button>
            <span id={id}>Gradients</span>
        </>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {() => void} props.onClick
 * @param {() => void} props.upload
 * @param {import('@preact/signals').Signal<CustomizerData>} props.data
 */
function BackgroundImagePanel(props) {
    const id = useId();
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

    // prettier-ignore
    const label = empty.value === true
        ? <span id={id}>Add Background</span>
        : <span id={id}>My Backgrounds</span>;

    if (empty.value === true) {
        return (
            <Fragment>
                <button
                    class={cn(styles.bgPanel, styles.bgPanelEmpty)}
                    aria-checked={props.checked}
                    aria-labelledby={id}
                    role={'radio'}
                    onClick={props.upload}
                >
                    <PlusIcon />
                </button>
                {label}
            </Fragment>
        );
    }

    // prettier-ignore
    const image = selectedImage.value !== null
        ? selectedImage.value?.thumb
        : firstImage.value?.thumb;

    return (
        <Fragment>
            <button
                class={cn(styles.bgPanel)}
                onClick={props.onClick}
                aria-checked={props.checked}
                aria-labelledby={id}
                style={{
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {props.checked && <CircleCheck />}
            </button>
            {label}
        </Fragment>
    );
}
