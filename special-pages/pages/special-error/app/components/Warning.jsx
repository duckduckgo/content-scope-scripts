import { h } from 'preact';
import classNames from 'classnames';
import { useTypedTranslation } from '../types';
import { useMessaging } from '../providers/MessagingProvider';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { usePlatformName } from '../providers/SettingsProvider';
import { useWarningHeading, useWarningContent } from '../hooks/ErrorStrings';
import { Text } from '../../../../shared/components/Text/Text';
import { Button } from '../../../../shared/components/Button/Button';

import styles from './Warning.module.css';

/**
 * @param {object} props
 * @param {import('preact').JSX.MouseEventHandler<EventTarget>} props.onClick
 */
export function AdvancedInfoButton({ onClick }) {
    const { t } = useTypedTranslation();
    const platformName = usePlatformName();

    return (
        <Button
            variant={platformName === 'macos' ? 'standard' : 'ghost'}
            className={classNames(styles.button, styles.advanced)}
            onClick={onClick}
        >
            {platformName === 'ios' ? t('advancedButton') : t('advancedEllipsisButton')}
        </Button>
    );
}

export function LeaveSiteButton() {
    const { t } = useTypedTranslation();
    const { messaging } = useMessaging();
    const platformName = usePlatformName();

    return (
        <Button
            variant={platformName === 'macos' ? 'accent' : 'primary'}
            className={classNames(styles.button, styles.leaveSite)}
            onClick={() => messaging?.leaveSite()}
        >
            {t('leaveSiteButton')}
        </Button>
    );
}

export function WarningHeading() {
    const { kind } = useErrorData();
    const heading = useWarningHeading();
    const platformName = usePlatformName();

    return (
        <header className={classNames(styles.heading, styles[kind])}>
            <i className={styles.icon} aria-hidden="true" />
            <Text
                as="h1"
                variant={platformName === 'macos' ? 'title-2-emphasis' : 'title-2'}
                strictSpacing={platformName !== 'macos'}
                className={styles.title}
            >
                {heading}
            </Text>
        </header>
    );
}

export function WarningContent() {
    const content = useWarningContent();

    return (
        <div className={styles.content}>
            {content.map((text) => (
                <Text as="p" variant="body">
                    {text}
                </Text>
            ))}
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.advancedInfoVisible
 * @param {() => void} props.advancedButtonHandler
 */
export function Warning({ advancedInfoVisible, advancedButtonHandler }) {
    return (
        <section className={styles.container}>
            <WarningHeading />

            <WarningContent />

            <div className={styles.buttonContainer}>
                {!advancedInfoVisible && <AdvancedInfoButton onClick={() => advancedButtonHandler()} />}
                <LeaveSiteButton />
            </div>
        </section>
    );
}
