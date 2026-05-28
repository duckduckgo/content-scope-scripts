import { h } from 'preact';
import classNames from 'classnames';
import { useTypedTranslation } from '../types';
import { useMessaging } from '../providers/MessagingProvider';
import { useErrorData } from '../providers/SpecialErrorProvider';
import { usePlatformName, useIsMobile } from '../providers/SettingsProvider';
import { useGeneralPageProblemButtonText, useWarningHeading, useWarningContent } from '../hooks/ErrorStrings';
// eslint-disable-next-line no-redeclare -- shadows DOM global `Text` intentionally
import { Text } from '../../../../shared/components/Text/Text';
import { Button } from '../../../../shared/components/Button/Button';

import styles from './Warning.module.css';

/**
 * @param {"android"|"windows"|"ios"|"macos"|"extension"|undefined} platformName
 * @returns {import('../../../../shared/components/Button/Button').ButtonProps['variant']}
 */
function getPrimaryActionButtonVariant(platformName) {
    switch (platformName) {
        case 'ios':
        case 'android':
            return 'primary';
        case 'windows':
            return 'accentBrand';
        default:
            return 'accent';
    }
}

/**
 * @param {object} props
 * @param {import('preact').JSX.MouseEventHandler<EventTarget>} props.onClick
 */
export function AdvancedInfoButton({ onClick }) {
    const { t } = useTypedTranslation();
    const isMobile = useIsMobile();
    const buttonVariant = isMobile ? 'ghost' : 'standard';

    return (
        <Button variant={buttonVariant} className={classNames(styles.button, styles.advanced)} onClick={onClick}>
            {isMobile ? t('advancedButton') : t('advancedEllipsisButton')}
        </Button>
    );
}

export function LeaveSiteButton() {
    const { t } = useTypedTranslation();
    const { messaging } = useMessaging();
    const platformName = usePlatformName();
    const buttonVariant = getPrimaryActionButtonVariant(platformName);

    return (
        <Button variant={buttonVariant} className={classNames(styles.button, styles.leaveSite)} onClick={() => messaging?.leaveSite()}>
            {t('leaveSiteButton')}
        </Button>
    );
}

export function VisitSiteButton() {
    const { t } = useTypedTranslation();
    const { messaging } = useMessaging();
    const { kind } = useErrorData();
    const platformName = usePlatformName();
    const generalPageProblemButtonText = useGeneralPageProblemButtonText();
    const buttonVariant = getPrimaryActionButtonVariant(platformName);

    const title = kind === 'generalPageProblem' ? generalPageProblemButtonText : t('visitSiteButton');
    return (
        <Button variant={buttonVariant} className={classNames(styles.button, styles.leaveSite)} onClick={() => messaging?.openInBrowser()}>
            {title}
        </Button>
    );
}

export function WarningHeading() {
    const heading = useWarningHeading();
    const { kind } = useErrorData();
    const platformName = usePlatformName();
    const isMobile = useIsMobile();
    if (!heading) return null;

    /** @type {'title-2'|'title-2-emphasis'|'custom-title-1'} */
    let textVariant;
    switch (platformName) {
        case 'ios':
        case 'android':
            textVariant = 'title-2';
            break;
        case 'windows':
            textVariant = 'custom-title-1';
            break;
        default:
            textVariant = 'title-2-emphasis';
    }

    return (
        <header className={classNames(styles.heading, styles[kind])}>
            <i className={styles.icon} aria-hidden="true" />
            <Text as="h1" variant={textVariant} strictSpacing={isMobile} className={styles.title}>
                {heading}
            </Text>
        </header>
    );
}

export function WarningContent() {
    const content = useWarningContent();
    if (!content.length) return null;

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
    const { kind } = useErrorData();
    const isGeneralPageProblem = kind === 'generalPageProblem';

    return (
        <section className={styles.container}>
            <WarningHeading />

            <WarningContent />

            <div className={styles.buttonContainer}>
                {!isGeneralPageProblem && !advancedInfoVisible && <AdvancedInfoButton onClick={() => advancedButtonHandler()} />}
                {isGeneralPageProblem ? <VisitSiteButton /> : <LeaveSiteButton />}
            </div>
        </section>
    );
}
