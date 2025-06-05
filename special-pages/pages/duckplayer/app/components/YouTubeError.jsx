import { h } from 'preact';
import cn from 'classnames';
import { Settings } from '../settings';
import { useTypedTranslation } from '../types.js';
import { Button, OpenInIcon } from './Button.jsx';
import { useOpenOnYoutubeHandler } from '../providers/SettingsProvider.jsx';

import styles from './YouTubeError.module.css';
import { useLocale, useYouTubeError } from '../providers/YouTubeErrorProvider';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';

/**
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 * @typedef {import('preact').ComponentChild} ComponentChild
 * @typedef {{heading: ComponentChild, messages: ComponentChild[], variant: 'list'|'inline'|'paragraphs'}} ErrorStrings
 */

/**
 * @param {YouTubeError} youtubeError
 * @param {string} locale
 * @returns {ErrorStrings}
 */
function useErrorStrings(youtubeError, locale) {
    const { t } = useTypedTranslation();

    let version = locale === 'en' ? 'long' : 'classic';

    // TODO: Remove after ship review
    const urlParams = new URLSearchParams(window.location.search);
    const isAlternativeCopy = urlParams.has('alternativeCopy');
    if (version === 'long' && isAlternativeCopy) {
        version = 'short';
    }

    /**
     * @type {Record<string, Partial<Record<YouTubeError, ErrorStrings>>  & { unknown: ErrorStrings }>}
     */
    const versions = {
        classic: {
            'sign-in-required': {
                heading: t('blockedVideoErrorHeading1'),
                messages: [t('signInRequiredErrorMessage1a'), t('signInRequiredErrorMessage1b')],
                variant: 'paragraphs',
            },
            unknown: {
                heading: t('blockedVideoErrorHeading1'),
                messages: [t('blockedVideoErrorMessage1a'), t('blockedVideoErrorMessage1b')],
                variant: 'paragraphs',
            },
        },
        long: {
            'sign-in-required': {
                heading: t('signInRequiredErrorHeading2'),
                messages: [t('signInRequiredErrorMessage2a'), t('signInRequiredErrorMessage2b')],
                variant: 'paragraphs',
            },
            'age-restricted': {
                heading: t('ageRestrictedErrorHeading1'),
                messages: [t('ageRestrictedErrorMessage1a'), t('ageRestrictedErrorMessage1b')],
                variant: 'paragraphs',
            },
            'no-embed': {
                heading: t('noEmbedErrorHeading1'),
                messages: [t('noEmbedErrorMessage1a'), t('noEmbedErrorMessage1b')],
                variant: 'paragraphs',
            },
            unknown: {
                heading: t('unknownErrorHeading1'),
                messages: [t('unknownErrorMessage1a'), t('unknownErrorMessage1b')],
                variant: 'paragraphs',
            },
        },
        short: {
            'sign-in-required': {
                heading: t('signInRequiredErrorHeading3'),
                messages: [t('signInRequiredErrorMessage3a'), t('signInRequiredErrorMessage3b')],
                variant: 'paragraphs',
            },
            'age-restricted': {
                heading: t('ageRestrictedErrorHeading1'),
                messages: [t('ageRestrictedErrorMessage1a'), t('ageRestrictedErrorMessage1b')],
                variant: 'paragraphs',
            },
            'no-embed': {
                heading: t('noEmbedErrorHeading1'),
                messages: [t('noEmbedErrorMessage1a'), t('noEmbedErrorMessage1b')],
                variant: 'paragraphs',
            },
            unknown: {
                heading: t('unknownErrorHeading1'),
                messages: [t('unknownErrorMessage1a'), t('unknownErrorMessage1b')],
                variant: 'paragraphs',
            },
        },
    };

    return versions[version]?.[youtubeError] || versions[version]?.['unknown'] || versions['classic']['unknown'];
}

/**
 * @param {object} props
 * @param {Settings['layout']} props.layout
 * @param {import("../embed-settings.js").EmbedSettings|null} [props.embed]
 */
export function YouTubeError({ layout, embed }) {
    const youtubeError = useYouTubeError();
    const locale = useLocale();
    if (!youtubeError) {
        return null;
    }

    const { t } = useTypedTranslation();
    const openOnYoutube = useOpenOnYoutubeHandler();
    const { heading, messages, variant } = useErrorStrings(youtubeError, locale);
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
