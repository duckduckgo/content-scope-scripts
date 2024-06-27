// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, h } from 'preact'
import { useMessaging } from '../index.js'
import classNames from 'classnames'
import { useTranslation } from '../../../../shared/components/TranslationProvider'
import { Text } from '../../../../shared/components/Text/Text'
import { Card } from '../../../../shared/components/Card/Card'
import { Button } from '../../../../shared/components/Button/Button'
import { ContentPlaceholder } from './ContentPlaceholder'

import styles from './ReleaseNotes.module.css'

/**
 * @typedef {import('../../../../types/release-notes').UpdateMessage} UpdateMessage
 * @typedef {{ title?: string, notes: string[] }} Notes
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
    const { t } = useTranslation()

    const statusTexts = {
        loaded: t('DuckDuckGo is up to date'),
        loading: t('Checking for update'),
        updateReady: t('newer version available')
    }

    return (
        <Text variant="title-2" className={styles.statusText}>
            {t('Version number', { version: `${version}` })} — {statusTexts[status]}
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
 * @param {number} props.timestamp
 */
function StatusTimestamp ({ timestamp }) {
    const { t } = useTranslation()

    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000))

    const timeString = date.toLocaleTimeString('en', { timeStyle: 'short' })
    let dateString = `${date.toLocaleDateString('en', { dateStyle: 'full' })} ${timeString}`

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
 * @param {UpdateMessage['status']} props.status
 * @param {number} props.lastUpdate
 * @param {string} props.version
 */
export function UpdateStatus ({ status, lastUpdate, version }) {
    return (
        <div className={styles.statusGrid}>
            <StatusIcon status={status} className={styles.gridIcon}/>
            <StatusText status={status} version={version} />
            <StatusTimestamp timestamp={lastUpdate} />
        </div>
    )
}

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.version
 */
export function ReleaseNotesHeader ({ title, version}) {
    const { t } = useTranslation()

    return (
        <header className={styles.notesHeading}>
            <h2 className={styles.releaseTitle}>
                {title}
                <span className={styles.newTag}>{t('New')}</span>
            </h2>
            <Text variant="title-2" className={styles.releaseVersion}>
                {t('Version number', { version: `${version}` })}
            </Text>
        </header>
    )
}

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string[]} props.notes
 */
export function ReleaseNotesList ({ notes, title }) {
    return (
        <div class={styles.listContainer}>
            {title && <Text as="h3" variant="headline">{title}</Text>}
            <ul className={styles.list}>
                {notes.map(note => (<Text as="li" variant="body" className={styles.listItem}>{note}</Text>))}
            </ul>
        </div>
    )
}

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.version
 * @param {Notes[]} props.releaseNotes
 */
export function ReleaseNotesContent ({ title, version, releaseNotes }) {
    return (
        <Fragment>
            <ReleaseNotesHeader title={title} version={version}/>
            <div className={styles.listGrid}>
                {releaseNotes.map(({title, notes}) => <ReleaseNotesList title={title} notes={notes}/>)}
            </div>
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {UpdateMessage} props.releaseData
 */
export function ReleaseNotes ({ releaseData }) {
    const { t } = useTranslation()
    const { messages } = useMessaging()

    const onRestartButtonClick = () => {
        messages?.browserRestart()
    }

    const { status, currentVersion, lastUpdate, latestVersion, releaseTitle, releaseNotes, releaseNotesPrivacyPro } = releaseData

    /**
     * @type {Notes[]}
     */
    const notes = [
        ...releaseNotes?.length ? [{ notes: releaseNotes }] : [],
        ...releaseNotesPrivacyPro?.length ? [{ title: t('For Privacy Pro Subscribers'), notes: releaseNotesPrivacyPro }] : [],
    ]

    return (
        <article className={styles.article}>
            <header className={styles.header}>
                <PageTitle title={t('Browser Release Notes')}/>
                <UpdateStatus status={status} lastUpdate={lastUpdate} version={currentVersion}/>
                {status === 'updateReady' && <Button onClick={onRestartButtonClick}>{t('Restart to Update')}</Button>}
            </header>
            <Card className={styles.card}>
                {status === 'loading'
                    ? <ContentPlaceholder />
                    : releaseTitle && notes.length && <ReleaseNotesContent title={releaseTitle} version={latestVersion || currentVersion} releaseNotes={notes}/>}
            </Card>
        </article>
    )
}
