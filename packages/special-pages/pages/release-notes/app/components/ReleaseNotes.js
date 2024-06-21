// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, h } from 'preact'
import classNames from 'classnames'
import { useTranslation } from "../../../../shared/components/TranslationProvider"
import { DuckDuckGoLogo } from '../../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo'
import { Card } from '../../../../shared/components/Card/Card'
import styles from './ReleaseNotes.module.css'
import { Button } from '../../../../shared/components/Button/Button'

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string[]} props.notes
 */
function ReleaseNotesList({ notes, title }) {
    return (
        <Fragment>
            {title && <h3 className={styles.releaseNotesSubheading}>{title}</h3>}
            <ul className={styles.releaseNotesList}>
                {notes?.map(note => (<li>{note}</li>))}
            </ul>
        </Fragment>
    )
}

/**
 * @param {object} props
 * @param {string} [props.status]
 * @param {string} [props.currentVersion]
 */
function StatusText({ status, currentVersion }) {
    const { t } = useTranslation()

    let statusText

    switch(status) {
        case 'updateReady':
            statusText = t('newer version available')
            break
        case 'loaded':
            statusText = t('DuckDuckGo is up to date')
            break
        default:
            statusText = t('Checking for update')
    }

    return (
        <p className={styles.statusText}>
            {t('Version number', { version: `${currentVersion}` })} — {statusText}
        </p>
    )
}

/**
 * @param {object} props
 * @param {string} [props.status]
 * @param {string} [props.className]
 */
function StatusIcon({ status, className }) {
    let iconClass

    switch(status) {
        case 'updateReady':
            iconClass = styles.alertIcon
            break
        case 'loaded':
            iconClass = styles.checkIcon
            break
        default:
            iconClass = styles.spinnerIcon
            break
    }

    return <div className={classNames(styles.statusIcon, iconClass, className)} />
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
 * @param {import('../../../../types/release-notes').UpdateMessage} props.releaseData
 */
export function ReleaseNotes({ releaseData })  {
    const { t } = useTranslation()
    const { status, currentVersion, latestVersion, lastUpdate, releaseTitle, releaseNotes, releaseNotesPrivacyPro } = releaseData
    const releaseVersion = latestVersion || currentVersion

    // TODO: Move date logic outside of component
    const updatedDate = new Date(lastUpdate)
    const today = new Date()
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));

    const timeString = updatedDate.toLocaleTimeString('en', { timeStyle: 'short'});
    let dateString = `${updatedDate.toLocaleDateString('en', { dateStyle: 'full'})} ${timeString}`

    if (
        updatedDate.getDate() === yesterday.getDate() &&
        updatedDate.getMonth() === yesterday.getMonth() &&
        updatedDate.getFullYear() === yesterday.getFullYear()
      ) dateString = t('Yesterday at', { time: timeString })

    if (
        updatedDate.getDate() === today.getDate() &&
        updatedDate.getMonth() === today.getMonth() &&
        updatedDate.getFullYear() === today.getFullYear()
      ) dateString = t('Today at', { time: timeString })

      return (
        <Fragment>
            <DuckDuckGoLogo />
            <article className={styles.content}>
                <header>
                    <h1 className={styles.title}>{t('Browser Release Notes')}</h1>
                    <div className={styles.statusGrid}>
                        <StatusIcon status={status} className={styles.gridIcon}/>

                        {currentVersion && <StatusText status={status} currentVersion={currentVersion} />}

                        <p className={styles.statusTimestamp}>{t('Last checked', { date: dateString })}</p>
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
                                <p className={styles.releaseVersion}>
                                    {t('Version number', { version: `${releaseVersion}` })}
                                </p>
                            </header>

                            {releaseNotes?.length &&
                                <ReleaseNotesList notes={releaseNotes} />}

                            {releaseNotesPrivacyPro?.length &&
                                <ReleaseNotesList notes={releaseNotesPrivacyPro} title={t('For Privacy Pro Subscribers')}/>}
                        </Fragment>}
                </Card>
            </article>
        </Fragment>
    )
}
