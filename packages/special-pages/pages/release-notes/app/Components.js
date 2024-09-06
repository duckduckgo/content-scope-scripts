import { h } from 'preact'
import { DuckDuckGoLogo } from '../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo'
import {
    PageTitle,
    UpdateStatus,
    ReleaseNotesHeading,
    ReleaseNotesSubheading,
    ReleaseNotesList,
    ReleaseNotesContent,
    ReleaseNotes
} from './components/ReleaseNotes'
import { EasterEgg } from './components/EasterEgg'
import { Button } from '../../../shared/components/Button/Button'
import { Card } from '../../../shared/components/Card/Card'
import { ContentPlaceholder } from './components/ContentPlaceholder'
import { useTypedTranslation } from '../app/types'

import styles from './Components.module.css'
import { sampleData } from './sampleData.js'
import { useEffect, useState } from 'preact/hooks'

export function Components () {
    const { t } = useTypedTranslation()
    const todayInMilliseconds = Date.now()
    const yesterdayInMilliseconds = new Date(todayInMilliseconds - (24 * 60 * 60 * 1000)).getTime()

    /**
     * @type {import('../app/types.js').Notes[]}
     */
    const sampleNotesData = [
        {
            notes: [
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vel viverra est. Ut non nisi lacus. Ut sodales leo sed ex condimentum tincidunt.',
                'Sed eget risus luctus, convallis sapien nec, tincidunt orci.', 'Sed et lobortis enim. Curabitur sit amet placerat felis.']
        }, {
            icon: 'PrivacyPro',
            title: t('forPrivacyProSubscribers'),
            notes: [
                'Cras egestas, dui eu sodales congue, ex augue vehicula ipsum, sed egestas est justo in enim.',
                'Duis varius in ex at vestibulum. Morbi finibus fringilla urna, ac varius quam vestibulum sit amet.',
                'Morbi a ligula vel metus ultrices sodales quis vel velit.'
            ]
        }]

    return (
        <main className={styles.main}>
            <LoadingThen>
                <ReleaseNotes releaseData={sampleData.loaded} />
            </LoadingThen>
        </main>
    )
}

function LoadingThen ({ children }) {
    const [ready, setReady] = useState(false)
    useEffect(() => {
        setTimeout(() => setReady(true), 1000)
    }, [])
    if (ready) return children
    return <ReleaseNotes releaseData={sampleData.loading} />
}
