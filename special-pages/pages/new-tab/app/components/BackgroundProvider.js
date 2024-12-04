import { createContext, Fragment, h } from 'preact';
import styles from './BackgroundReceiver.module.css';
import { values } from '../customizer/values.js';
import { computed, signal } from '@preact/signals';
import { useContext } from 'preact/hooks';
import { CustomizerContext } from '../customizer/CustomizerProvider.js';

/**
 * @import { BackgroundVariant } from "../../types/new-tab"
 */

const BackgroundContext = createContext({
    /** @type {import("@preact/signals").Signal<BackgroundVariant>} */
    current: signal({ kind: 'default' }),
});

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function BackgroundProvider({ children }) {
    const { data } = useContext(CustomizerContext);
    const bg = computed(() => data.value.background);
    return <BackgroundContext.Provider value={{ current: bg }}>{children}</BackgroundContext.Provider>;
}

/**
 *
 */
export function BackgroundConsumer() {
    const { current } = useContext(BackgroundContext);
    const background = current.value;
    switch (background.kind) {
        case 'default': {
            return <div class={styles.root}></div>;
        }
        case 'hex': {
            return (
                <div
                    class={styles.root}
                    style={{
                        backgroundColor: background.value,
                    }}
                ></div>
            );
        }
        case 'color': {
            const color = values.colors[background.value];
            return (
                <div
                    class={styles.root}
                    style={{
                        backgroundColor: color.hex,
                    }}
                ></div>
            );
        }
        case 'gradient': {
            const gradient = values.gradients[background.value];
            return (
                <Fragment key="gradient">
                    <div
                        class={styles.root}
                        style={{
                            backgroundImage: `url(${gradient.path})`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                    <div
                        class={styles.root}
                        style={{
                            backgroundImage: `url(gradients/grain.png)`,
                            backgroundRepeat: 'repeat',
                            opacity: 0.5,
                            mixBlendMode: 'soft-light',
                        }}
                    ></div>
                </Fragment>
            );
        }
        case 'userImage': {
            const img = background.value;
            return (
                <div
                    class={styles.root}
                    style={{
                        backgroundImage: `url(${img.src})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center center',
                    }}
                ></div>
            );
        }
        default: {
            console.warn('Unreachable!');
            return <div className={styles.root}></div>;
        }
    }
}
