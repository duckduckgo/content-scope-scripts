// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, h } from 'preact'
import { useMessaging } from '../index'
import classNames from 'classnames'
import { useTypedTranslation } from '../types'
import { Text } from '../../../../shared/components/Text/Text'
import { Card } from '../../../../shared/components/Card/Card'
import { Button } from '../../../../shared/components/Button/Button'
import { ContentPlaceholder } from './ContentPlaceholder'

import styles from './ReleaseNotes.module.css'

/**
 * @typedef {import('../../../../types/release-notes').UpdateMessage} UpdateMessage
 * @typedef {import('../types.js').Notes} Notes
 */

/**
 * @param {object} props
 * @param {string} props.title
 */
export function PageTitle ({ title }) {
    return (
        <h1 className={styles.title}>{title}</h1>
    )
}

/**
 * @param {object} props
 * @param {UpdateMessage['status']} props.status
 * @param {string} props.version
 */
function StatusText ({ status, version }) {
    const { t } = useTypedTranslation()

    const statusTexts = {
        loaded: t('browserUpToDate'),
        loading: t('checkingForUpdate'),
        updateReady: t('newVersionAvailable')
    }

    return (
        <Text variant="title-2" className={styles.statusText}>
            {t('versionNumber', { version: `${version}` })} — {statusTexts[status]}
        </Text>
    )
}

/**
 * @param {object} props
 * @param {UpdateMessage['status']} props.status
 * @param {string} [props.className]
 */
function StatusIcon ({ status, className }) {
    const iconClasses = {
        loaded: styles.checkIcon,
        loading: styles.spinnerIcon,
        updateReady: styles.alertIcon
    }

    return <div className={classNames(styles.statusIcon, iconClasses[status], className)} />
}

/**
 * @param {object} props
 * @param {number} props.timestamp - in milliseconds
 */
function StatusTimestamp ({ timestamp }) {
    const { t } = useTypedTranslation()

    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000))

    const timeString = date.toLocaleTimeString('en', { timeStyle: 'short' })
    let dateString = `${date.toLocaleDateString('en', { dateStyle: 'full' })} ${timeString}`

    if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    ) dateString = t('yesterdayAt', { time: timeString })

    if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    ) dateString = t('todayAt', { time: timeString })

    return <Text variant="body" className={styles.statusTimestamp}>{t('lastChecked', { date: dateString })}</Text>
}

/**
 * @param {object} props
 * @param {UpdateMessage['status']} props.status
 * @param {number} props.timestamp - in milliseconds
 * @param {string} props.version
 */
export function UpdateStatus ({ status, timestamp, version }) {
    return (
        <div className={styles.statusContainer}>
            <StatusIcon status={status} className={styles.gridIcon}/>
            <StatusText status={status} version={version} />
            <StatusTimestamp timestamp={timestamp} />
        </div>
    )
}

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.version
 */
export function ReleaseNotesHeading ({ title, version }) {
    const { t } = useTypedTranslation()

    return (
        <header className={styles.notesHeading}>
            <h2 className={styles.releaseTitle}>
                {title}
                <span className={styles.newTag}>{t('new')}</span>
            </h2>
            <Text variant="title-2" className={styles.releaseVersion}>
                {t('versionNumber', { version: `${version}` })}
            </Text>
        </header>
    )
}

/**
 * @param {Omit<Notes, 'notes'>} props
 */
export function ReleaseNotesSubheading ({ icon, title }) {
    return (
        <div className={styles.notesSubheading}>
            { icon && <span className={classNames(styles.notesIcon, styles[`notesIcon${icon}`])} />}
            <Text as="h3" variant="headline">{title}</Text>
        </div>
    )
}

/**
 * @param {Object} props
 * @param {import("preact").ComponentChild[]} props.notes
 */
export function ReleaseNotesList ({ notes }) {
    return (
        <ul className={styles.list}>
            {notes.map(note => (<Text as="li" variant="body" className={styles.listItem}>{note}</Text>))}
        </ul>
    )
}

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} props.version
 * @param {Notes[]} props.notes
 */
export function ReleaseNotesContent ({ title: releaseTitle, version: releaseVersion, notes: releaseNotes }) {
    if (!releaseTitle || !releaseNotes.length) return null

    return (
        <Fragment>
            <ReleaseNotesHeading title={releaseTitle} version={releaseVersion}/>
            <div className={styles.listGrid}>
                {releaseNotes.map(({ icon, title, notes }) => (
                    <div class={styles.listContainer}>
                        {title && <ReleaseNotesSubheading title={title} icon={icon} />}
                        <ReleaseNotesList notes={notes} />
                    </div>
                ))}
            </div>
        </Fragment>
    )
}

/**
 * @param {object} props
 * @param {UpdateMessage} props.releaseData
 */
export function ReleaseNotes ({ releaseData }) {
    const { t } = useTypedTranslation()
    const { messages } = useMessaging()

    const onRestartButtonClick = () => {
        messages?.browserRestart()
    }

    const { status, currentVersion, lastUpdate, latestVersion, releaseTitle, releaseNotes, releaseNotesPrivacyPro } = releaseData
    const timestampInMilliseconds = lastUpdate * 1000

    /**
     * @type {Notes[]}
     */
    const notes = []

    if (releaseNotes?.length) {
        notes.push({ notes: releaseNotes })
    }

    if (releaseNotesPrivacyPro?.length) {
        notes.push({
            icon: 'PrivacyPro',
            title: t('forPrivacyProSubscribers'),
            notes: [
                ...releaseNotesPrivacyPro,
                /* The following should only get translated when the full Release Notes are localized */
                <span>Not subscribed? Find out more at <a href="https://duckduckgo.com/pro" target="_blank">duckduckgo.com/pro</a></span>
            ]
        })
    }

    return (
        <article className={styles.article}>
            <header className={styles.heading}>
                <PageTitle title={t('browserReleaseNotes')}/>
                <UpdateStatus status={status} timestamp={timestampInMilliseconds} version={currentVersion}/>
                {status === 'updateReady' &&
                    <div className={styles.buttonContainer}>
                        <Button onClick={onRestartButtonClick}>{t('restartToUpdate')}</Button>
                    </div>}
            </header>
            <Card className={styles.card}>
                {status === 'loading'
                    ? <ContentPlaceholder />
                    : <ReleaseNotesContent
                        title={releaseTitle}
                        version={latestVersion || currentVersion}
                        notes={notes}/>}
            </Card>
        </article>
    )
}
