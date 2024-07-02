import { h } from 'preact'
import { DuckDuckGoLogo } from '../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo'
import { PageTitle, UpdateStatus, ReleaseNotesHeading, ReleaseNotesSubheading, ReleaseNotesList, ReleaseNotesContent } from './components/ReleaseNotes'
import { Button } from '../../../shared/components/Button/Button'
import { Card } from '../../../shared/components/Card/Card'
import { ContentPlaceholder } from './components/ContentPlaceholder'
import { useTypedTranslation } from '../app/types'

import styles from './Components.module.css'

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
            <h1>Release Notes Components</h1>

            <h2>Duck Duck Logo</h2>
            <DuckDuckGoLogo />
            <hr/>

            <h2>Page Title</h2>
            <PageTitle title={t('browserReleaseNotes')}/>
            <hr/>

            <h2>Update Status</h2>
            <UpdateStatus status="loading" version="1.0.1" timestamp={yesterdayInMilliseconds}/>
            <UpdateStatus status="loaded" version="1.0.1" timestamp={todayInMilliseconds}/>
            <UpdateStatus status="updateReady" version="1.2.0" timestamp={todayInMilliseconds}/>
            <hr/>

            <h2>Restart Button</h2>
            <div>
                <Button platform="apple">{t('restartToUpdate')}</Button>
            </div>
            <hr/>

            <h2>Content Placeholder</h2>
            <ContentPlaceholder/>
            <hr/>

            <h2>Release Notes Heading</h2>
            <ReleaseNotesHeading title="May 10 2024" version="1.2.0"/>
            <hr/>

            <h2>Release Notes Subheading</h2>
            <ReleaseNotesSubheading title="Release Notes Heading without Icon"/>
            <ReleaseNotesSubheading icon="PrivacyPro" title="Release Notes Heading with Privacy Pro Icon"/>
            <hr/>

            <h2>Release Notes List</h2>
            <ReleaseNotesList notes={sampleNotesData[0].notes} />
            <hr/>

            <h2>Content Placeholder Inside a Card</h2>
            <Card className={styles.card}>
                <ContentPlaceholder/>
            </Card>
            <hr/>

            <h2>Release Notes Inside a Card</h2>
            <Card className={styles.card}>
                <ReleaseNotesContent title="May 10 2024" version="1.2.0" notes={sampleNotesData} />
            </Card>
        </main>
    )
}
