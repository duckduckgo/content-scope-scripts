import { h } from 'preact'
import { DuckDuckGoLogo } from '../../../shared/components/DuckDuckGoLogo/DuckDuckGoLogo'
import { PageTitle, UpdateStatus, ReleaseNotesHeader, ReleaseNotesList, ReleaseNotesContent } from './components/ReleaseNotes'
import { Button } from '../../../shared/components/Button/Button'
import { Card } from '../../../shared/components/Card/Card'
import { ContentPlaceholder } from './components/ContentPlaceholder'

import styles from './Components.module.css'

export function Components () {
    const todayTimestamp = Date.now()
    const yesterdayTimestamp = new Date(todayTimestamp - (24 * 60 * 60 * 1000)).getTime()

    return (
        <main className={styles.main}>
            <h1>Release Notes Components</h1>

            <h2>Duck Duck Logo</h2>
            <DuckDuckGoLogo />
            <hr/>

            <h2>Page Title</h2>
            <PageTitle title="Browser Release Notes"/>
            <hr/>

            <h2>Update Status</h2>
            <UpdateStatus status="loading" version="1.0.1" lastUpdate={yesterdayTimestamp}/>
            <UpdateStatus status="loaded" version="1.0.1" lastUpdate={todayTimestamp}/>
            <UpdateStatus status="updateReady" version="1.2.0" lastUpdate={todayTimestamp}/>
            <hr/>

            <h2>Restart Button</h2>
            <Button platform="apple">Restart to Update</Button>
            <hr/>

            <h2>Content Placeholder</h2>
            <ContentPlaceholder/>
            <hr/>

            <h2>Release Notes Header</h2>
            <ReleaseNotesHeader title="May 10 2024" version="1.2.0"/>
            <hr/>

            <h2>Release Notes List</h2>
            <ReleaseNotesList notes={["This is a release notes list without a subheading", "Feature description #2", "Feature description #3",]} />
            <ReleaseNotesList title="Release Notes Subheading" notes={["This is a release notes list with a subheading", "Feature description #2", "Feature description #3",]} />
            <hr/>

            <h2>Content Placeholder Inside a Card</h2>
            <Card className={styles.card}>
                <ContentPlaceholder/>
            </Card>
            <hr/>

            <h2>Release Notes List Inside a Card</h2>
            <Card className={styles.card}>
                <ReleaseNotesContent title="May 10 2024" version="1.2.0" releaseNotes={
                    [{ notes: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vel viverra est. Ut non nisi lacus. Ut sodales leo sed ex condimentum tincidunt.", "Sed eget risus luctus, convallis sapien nec, tincidunt orci.", "Sed et lobortis enim. Curabitur sit amet placerat felis."] },
                     { title: "For Privacy Pro Subscribers",  notes: ["Cras egestas, dui eu sodales congue, ex augue vehicula ipsum, sed egestas est justo in enim.", "Duis varius in ex at vestibulum. Morbi finibus fringilla urna, ac varius quam vestibulum sit amet.", "Morbi a ligula vel metus ultrices sodales quis vel velit."] }]} />
            </Card>
        </main>
    )
}
