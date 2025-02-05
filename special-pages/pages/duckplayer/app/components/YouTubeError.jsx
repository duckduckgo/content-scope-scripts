import { h } from 'preact';
import cn from 'classnames';
import { Settings } from '../settings';
import { useTypedTranslation } from '../types.js';

import styles from './YouTubeError.module.css';

/**
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 */

/* TODO: REFACTOR useErrorString */

/**
 * @param {YouTubeError} kind
 * @returns {{heading: Element, messages: Element[], variant: 'list'|'inline'|'paragraphs'}}
 */
function useErrorStrings(kind) {
    const { t } = useTypedTranslation();

    const translationsMap = {
        ['sign-in-required']: {
            heading: <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorHeading') }} />,
            messages: [
                <span dangerouslySetInnerHTML={{ __html: t('signInRequiredErrorMessage1') }} />,
                <span dangerouslySetInnerHTML={{ __html: t('signInRequiredErrorMessage2') }} />,
            ],
            variant: 'list',
        },
        ['age-restricted']: {
            heading: <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorHeading') }} />,
            messages: [
                <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorMessage1') }} />,
                <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorMessage2') }} />,
            ],
            variant: 'inline',
        },
        ['no-embed']: {
            heading: <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorHeading') }} />,
            messages: [
                <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorMessage1') }} />,
                <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorMessage2') }} />,
            ],
            variant: 'inline'
        },
    };

    if (!translationsMap[kind]) {
        throw new Error(`Missing translations for ${kind}`);
    }

    return translationsMap[kind];
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

                    {messages && variant === 'inline' &&
                    <p className={styles.messages}>
                        {messages.map((item) => <span>{item}</span>)}
                    </p>}

                    {messages && variant === 'paragraphs' &&
                    <div className={styles.messages}>
                        {messages.map((item) => <p>{item}</p>)}
                    </div>}

                    {messages && variant === 'list' &&
                    <ul className={styles.messages}>
                        {messages.map((item) => <li>{item}</li>)}
                    </ul>}
                </div>
            </div>
        </div>
    );
}
