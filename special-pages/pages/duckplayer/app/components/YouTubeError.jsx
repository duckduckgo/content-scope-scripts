import { h } from 'preact';
import cn from 'classnames';
import { Settings } from '../settings';
import { useTypedTranslation } from '../types.js';

import styles from './YouTubeError.module.css';

/**
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 * @typedef {import('preact').ComponentChild} ComponentChild
 */

/**
 * @param {YouTubeError} kind
 * @returns {{heading: ComponentChild, messages: ComponentChild[], variant: 'list'|'inline'|'paragraphs'}}
 */
function useErrorStrings(kind) {
    const { t } = useTypedTranslation();

    switch (kind) {
        case 'sign-in-required':
            return {
                heading: t('blockedVideoErrorHeading'),
                messages: [t('signInRequiredErrorMessage1'), t('signInRequiredErrorMessage2')],
                variant: 'paragraphs',
            };
        default:
            return {
                heading: t('blockedVideoErrorHeading'),
                messages: [t('blockedVideoErrorMessage1'), t('blockedVideoErrorMessage2')],
                variant: 'paragraphs',
            };
    }
}

/**
 * @param {object} props
 * @param {YouTubeError} props.kind
 * @param {Settings['layout']} props.layout
 */
export function YouTubeError({ kind, layout }) {
    const { heading, messages, variant } = useErrorStrings(kind);
    const classes = cn(styles.error, {
        [styles.desktop]: layout === 'desktop',
        [styles.mobile]: layout === 'mobile',
    });

    return (
        <div className={classes}>
            <div className={styles.container}>
                <span className={styles.icon}></span>

                <div className={styles.content}>
                    <h1 className={styles.heading}>{heading}</h1>

                    {messages && variant === 'inline' && (
                        <p className={styles.messages}>
                            {messages.map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </p>
                    )}

                    {messages && variant === 'paragraphs' && (
                        <div className={styles.messages}>
                            {messages.map((item) => (
                                <p key={item}>{item}</p>
                            ))}
                        </div>
                    )}

                    {messages && variant === 'list' && (
                        <ul className={styles.messages}>
                            {messages.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
