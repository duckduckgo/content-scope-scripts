// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, h } from 'preact'
import classNames from 'classnames'
import { useTranslation } from "../../../../shared/components/TranslationProvider"
import { Text } from '../../../../shared/components/Text/Text'
import { Card } from '../../../../shared/components/Card/Card'
import { Button } from '../../../../shared/components/Button/Button'

import styles from './ReleaseNotes.module.css'

/**
 * @typedef {import('../../../../types/release-notes').UpdateMessage} UpdateMessage
 */

/**
 * @param {object} props
 * @param {UpdateMessage['status']} [props.status]
 * @param {UpdateMessage['currentVersion']} [props.currentVersion]
 */
function StatusText({ status, currentVersion }) {
    const { t } = useTranslation()

    const statusTexts = {
        loaded: t('DuckDuckGo is up to date'),
        loading: t('Checking for update'),
        updateReady: t('newer version available'),
    }

    return (
        <Text variant="title-2" className={styles.statusText}>
            {t('Version number', { version: `${currentVersion}` })} — {statusTexts[status]}
        </Text>
    )
}

/**
 * @param {object} props
 * @param {UpdateMessage['status']} [props.status]
 * @param {string} [props.className]
 */
function StatusIcon({ status, className }) {
    const iconClasses = {
        loaded: styles.checkIcon,
        loading: styles.spinnerIcon,
        updateReady: styles.alertIcon,
    }

    return <div className={classNames(styles.statusIcon, iconClasses[status], className)} />
}

/**
 * @param {object} props
 * @param {number} props.timestamp
 */
function StatusTimestamp({ timestamp }) {
    const { t } = useTranslation()

    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));

    const timeString = date.toLocaleTimeString('en', { timeStyle: 'short'});
    let dateString = `${date.toLocaleDateString('en', { dateStyle: 'full'})} ${timeString}`

    if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) dateString = t('Yesterday at', { time: timeString })

    if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) dateString = t('Today at', { time: timeString })

    return <Text variant="body" className={styles.statusTimestamp}>{t('Last checked', { date: dateString })}</Text>
}

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string[]} props.notes
 */
function ReleaseNotesList({ notes, title }) {
    return (
        <Fragment>
            {title && <Text as="h3" variant="headline" className={styles.releaseNotesSubheading}>{title}</Text>}
            <ul className={styles.releaseNotesList}>
                {notes?.map(note => (<Text as="li" variant="body">{note}</Text>))}
            </ul>
        </Fragment>
    )
}

/**
 *
 */
function NewTag() {
    const { t } = useTranslation()

    return <span className={styles.newTag}>{t('New')}</span>
}

/**
 * Renders a purely visual placeholder for when content is still loading
 */
function ContentPlaceholder() {
    return (
        <div className={styles.contentPlaceholder} aria-hidden="true">
            <h2></h2>
            <p></p>
            <ul>
                <li><p></p><p></p></li>
                <li><p></p><p></p></li>
            </ul>
        </div>
    )
}

/**
 * @param {object} props
 * @param {UpdateMessage} props.releaseData
 */
export function ReleaseNotes({ releaseData })  {
    const { t } = useTranslation()
    const { status, currentVersion, latestVersion, lastUpdate, releaseTitle, releaseNotes, releaseNotesPrivacyPro } = releaseData
    const releaseVersion = latestVersion || currentVersion

      return (
        <article className={styles.content}>
            <header>
                <h1 className={styles.title}>{t('Browser Release Notes')}</h1>
                <div className={styles.statusGrid}>
                    <StatusIcon status={status} className={styles.gridIcon}/>

                    {currentVersion && <StatusText status={status} currentVersion={currentVersion} />}

                    <StatusTimestamp timestamp={lastUpdate} />
                </div>
                {status === 'updateReady' && <Button>{t('Restart to Update')}</Button>}
            </header>
            <Card className={styles.releaseNotesContent}>
                {status === 'loading'
                    ? <ContentPlaceholder />
                    : <Fragment>
                        <header>
                            {releaseTitle &&
                            <h2 className={styles.releaseTitle}>
                                {releaseTitle} <NewTag />
                            </h2>}
                            <Text variant="title-2" className={styles.releaseVersion}>
                                {t('Version number', { version: `${releaseVersion}` })}
                            </Text>
                        </header>

                        {releaseNotes?.length &&
                            <ReleaseNotesList notes={releaseNotes} />}

                        {releaseNotesPrivacyPro?.length &&
                            <ReleaseNotesList notes={releaseNotesPrivacyPro} title={t('For Privacy Pro Subscribers')}/>}
                    </Fragment>}
            </Card>
        </article>
    )
}
