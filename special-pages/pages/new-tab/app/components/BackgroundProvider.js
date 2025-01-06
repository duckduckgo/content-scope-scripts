import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './BackgroundReceiver.module.css';
import { values } from '../customizer/values.js';
import { useContext, useState } from 'preact/hooks';
import { CustomizerContext } from '../customizer/CustomizerProvider.js';
import { detectThemeFromHex } from '../customizer/utils.js';

/**
 * @import { BackgroundVariant, BrowserTheme } from "../../types/new-tab"
 */

/**
 * @param {BackgroundVariant} background
 * @param {BrowserTheme} browserTheme
 * @param {'light' | 'dark'} system
 * @return {{bg: 'light' | 'dark', browser: 'light' | 'dark'}}
 */
export function inferSchemeFrom(background, browserTheme, system) {
    const browser = themeFromBrowser(browserTheme, system);
    switch (background.kind) {
        case 'default':
            return { bg: browser, browser };
        case 'color': {
            const color = values.colors[background.value];
            return { bg: color.colorScheme, browser };
        }

        case 'gradient': {
            const gradient = values.gradients[background.value];
            return { bg: gradient.colorScheme, browser };
        }

        case 'userImage':
            return { bg: background.value.colorScheme, browser };

        case 'hex':
            return { bg: detectThemeFromHex(background.value), browser };
    }
}

/**
 * @param {BrowserTheme} browserTheme
 * @param {'light' | 'dark'} system
 * @return {'light' | 'dark'}
 */
export function themeFromBrowser(browserTheme, system) {
    if (browserTheme === 'system') {
        return system;
    }
    return browserTheme;
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<'light' | 'dark'>} props.browser
 */
export function BackgroundConsumer({ browser }) {
    const { data } = useContext(CustomizerContext);
    const background = data.value.background;

    switch (background.kind) {
        case 'default': {
            return <div className={styles.root} data-testid="BackgroundConsumer" data-background-kind="default" data-theme={browser} />;
        }
        case 'hex': {
            return (
                <div
                    class={styles.root}
                    data-animate="true"
                    data-testid="BackgroundConsumer"
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
                    data-animate="true"
                    data-background-color={color.hex}
                    data-testid="BackgroundConsumer"
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
                    <ImageCrossFade src={gradient.path}></ImageCrossFade>
                    <div
                        className={styles.root}
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
            return <ImageCrossFade src={img.src} />;
        }
        default: {
            console.warn('Unreachable!');
            return <div className={styles.root}></div>;
        }
    }
}

/**
 * @param {object} props
 * @param {string} props.src
 */
function ImageCrossFade({ src }) {
    /**
     * Proxy the image source, so that we can keep the old
     * image around whilst the new one is loading.
     */
    const [stable, setStable] = useState(src);
    /**
     * Trigger the animation:
     *
     * NOTE: this animation is deliberately NOT done purely with CSS-triggered state.
     * Whilst debugging in WebKit, I found the technique below to be 100% reliable
     * in terms of fading a new image over the top of an existing one.
     *
     * If you find a better way, please test in webkit-based browsers
     */
    return (
        <Fragment>
            <img src={stable} class={styles.root} style={{ display: src === stable ? 'none' : 'block' }} />
            <img
                src={src}
                class={cn(styles.root, styles.over)}
                onLoad={(e) => {
                    const elem = /** @type {HTMLImageElement} */ (e.target);

                    // HACK: This is what I needed to force, to get 100% predictability. 🤷
                    elem.style.opacity = '0';

                    const anim = elem.animate([{ opacity: '0' }, { opacity: '1' }], {
                        duration: 250,
                        iterations: 1,
                        easing: 'ease-in-out',
                        fill: 'both',
                    });

                    // when the fade completes, we want to reset the stable `src`.
                    // This allows the image underneath to be updated but also allows us to un-mount the fader on top.
                    anim.onfinish = () => {
                        setStable(src);
                    };
                }}
            />
        </Fragment>
    );
}
