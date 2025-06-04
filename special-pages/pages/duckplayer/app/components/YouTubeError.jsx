import { h } from 'preact';
import cn from 'classnames';
import { Settings } from '../settings';
import { useTypedTranslation } from '../types.js';
import { Button, OpenInIcon } from './Button.jsx';
import { useOpenOnYoutubeHandler } from '../providers/SettingsProvider.jsx';

import styles from './YouTubeError.module.css';
import { useYouTubeError } from '../providers/YouTubeErrorProvider';

/**
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 * @typedef {import('preact').ComponentChild} ComponentChild
 */

/**
 * @param {YouTubeError} youtubeError
 * @returns {{heading: ComponentChild, messages: ComponentChild[], variant: 'list'|'inline'|'paragraphs'}}
 */
function useErrorStrings(youtubeError) {
    const { t } = useTypedTranslation();

    switch (youtubeError) {
        case 'sign-in-required':
            return {
                heading: t('signInRequiredErrorHeading'),
                messages: [t('signInRequiredErrorMessage1'), t('signInRequiredErrorMessage2')],
                variant: 'paragraphs',
            };
        case 'age-restricted':
            return {
                heading: t('ageRestrictedErrorHeading'),
                messages: [t('ageRestrictedErrorMessage1'), t('ageRestrictedErrorMessage2')],
                variant: 'paragraphs',
            };
        case 'no-embed':
            return {
                heading: t('noEmbedErrorHeading'),
                messages: [t('noEmbedErrorMessage1'), t('noEmbedErrorMessage2')],
                variant: 'paragraphs',
            };
        case 'unknown':
        default:
            return {
                heading: t('unknownErrorHeading'),
                messages: [t('unknownErrorMessage1'), t('unknownErrorMessage2')],
                variant: 'paragraphs',
            };
    }
}

/**
 * @param {object} props
 * @param {Settings['layout']} props.layout
 * @param {import("../embed-settings.js").EmbedSettings|null} [props.embed]
 */
export function YouTubeError({ layout, embed }) {
    const youtubeError = useYouTubeError();
    if (!youtubeError) {
        return null;
    }

    const { t } = useTypedTranslation();
    const openOnYoutube = useOpenOnYoutubeHandler();
    const { heading, messages, variant } = useErrorStrings(youtubeError);
    const classes = cn(styles.error, {
        [styles.desktop]: layout === 'desktop',
        [styles.mobile]: layout === 'mobile',
    });

    return (
        <div className={classes}>
            <div className={styles.container}>
                <span className={styles.icon}></span>

                <div className={styles.content} data-testid="YouTubeErrorContent">
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

                    {embed && layout === 'desktop' && (
                        <div className={styles.buttons}>
                            <span className={styles.spacer}></span>
                            <Button
                                formfactor={'desktop'}
                                variant={'accent'}
                                buttonProps={{
                                    onClick: () => {
                                        openOnYoutube(embed);
                                    },
                                }}
                            >
                                <OpenInIcon />
                                {t('watchOnYoutube')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
