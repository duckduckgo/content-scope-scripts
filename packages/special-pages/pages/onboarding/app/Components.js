import styles from './components/App.module.css'
import { Stack } from './components/Stack'
import { Header } from './components/Header'
import { Progress } from './components/Progress'
import { ListItem } from './components/ListItem'
import { BounceIn, Check, Launch } from './components/Icons'
import { List } from './components/List'
import { Button, ButtonBar } from './components/Buttons'
import classNames from 'classnames'
import { h } from 'preact'
import { Background } from './components/Background'
import { BeforeAfter } from './components/BeforeAfter'
import { settingsElements, settingsRowItems } from './row-data'
import { Summary } from './pages/Summary'
import { i18n } from './text'
import { HomeButtonDropdown } from './components/Popover'

function noop (name) {
    return () => {
        alert('clicked ' + name)
    }
}

export function Components () {
    return (
        <main className={styles.main}>
            <Background/>
            <div class={styles.container}>
                <Stack gap='var(--sp-8)'>
                    <p><a href="?env=app">Onboarding Flow</a></p>
                    <Header title={'Welcome to DuckDuckGo'}/>
                    <Header title={'Tired of being tracked online?\nWe can help!'}/>
                    <Header title={'Unlike other browsers\nDuckDuckGo is private by default'}
                        aside={<Progress current={1} total={4}/>}/>
                    <Progress current={1} total={4}/>
                    <ButtonBar>
                        <Button>Button</Button>
                        <Button variant={'secondary'}>Button</Button>
                        <HomeButtonDropdown setEnabled={(value) => alert('enabled: ' + value)} />
                    </ButtonBar>
                    <ButtonBar><Button size="large">L Button</Button><Button size="large" variant={'secondary'}>L
                        Button</Button></ButtonBar>
                    <ButtonBar><Button size="xl">XL Button</Button><Button size="xl">XL Button
                        + <Launch/></Button></ButtonBar>
                    <ListItem icon={'search.png'} title={'Private Search'} secondaryText={'We don\'t track you. Ever.'}
                        inline={<BounceIn><Check/></BounceIn>}/>
                    <ListItem icon={'shield.png'} title={'Advanced Tracking Protection'}
                        secondaryText={'We block most trackers before they even load.'}/>
                    <ListItem icon={'cookie.png'} title={'Automatic Cookie Pop-Up Blocking'}
                        secondaryText={'We deny optional cookies for you & hide pop-ups.'}/>
                    <ListItem icon={'switch.png'} title={'Switch your default browser'}
                        secondaryText={'Always browse privately by default.'}/>
                    <ListItem icon={'bookmarks.png'} title={'Put your bookmarks in easy reach'}
                        secondaryText={'Show a bookmarks bar with your favorite bookmarks.'}/>
                    <ListItem icon={'session-restore.png'} title={'Pick up where you left off'}
                        secondaryText={'Always restart with all windows from your last session.'}/>
                    <ListItem icon={'home.png'} title={'Add a shortcut to your homepage'}
                        secondaryText={'Show a home button in your toolbar'}/>
                    <ListItem icon={'shield.png'} title={'Advanced Tracking Protection'}
                        secondaryText={'We block most trackers before they even load.'}/>
                    <ListItem icon={'import.png'} title={'Bring your stuff'}
                        secondaryText={'Import bookmarks, favorites, and passwords.'}/>

                    <div style={{ width: '480px' }}>
                        <List>
                            <ListItem icon={'search.png'} title={'Private Search'}
                                secondaryText={'We don\'t track you. Ever.'} inline={<Check/>}/>
                            <ListItem icon={'shield.png'} title={'Advanced Tracking Protection'}
                                secondaryText={'We block most trackers before they even load.'}
                                inline={<Check/>}/>
                            <ListItem icon={'cookie.png'} title={'Automatic Cookie Pop-Up Blocking'}
                                secondaryText={'We deny optional cookies for you & hide pop-ups.'}
                                inline={<Check/>}/>
                        </List>
                    </div>

                    <div style={{ width: '480px' }}>
                        <List>
                            <ListItem icon={'dock.png'} title={'Keep DuckDuckGo in your Dock'}
                                secondaryText={'Get to DuckDuckGo faster'} inline={<Check/>}>
                            </ListItem>
                            <ListItem icon={'import.png'} title={'Bring your stuff'}
                                secondaryText={'Import bookmarks, favorites, and passwords.'}>
                                <ListItem.Indent>
                                    <ButtonBar>
                                        <Button variant={'secondary'}>Skip</Button>
                                        <Button variant={'secondary'}>Import</Button>
                                    </ButtonBar>
                                </ListItem.Indent>
                            </ListItem>
                        </List>
                    </div>

                    <div style={{ width: '480px' }}>
                        <Stack>
                            <List>
                                {Object.keys(settingsRowItems).map(key => {
                                    return <ListItem
                                        icon={settingsRowItems[key].icon}
                                        title={settingsRowItems[key].title}
                                        secondaryText={settingsRowItems[key].secondaryText}
                                    />
                                })}
                            </List>
                        </Stack>
                    </div>

                    <div style={{ width: '480px' }}>
                        <Stack>
                            <List>
                                {Object.keys(settingsRowItems).map(key => {
                                    return <ListItem
                                        icon={settingsRowItems[key].icon}
                                        title={settingsRowItems[key].title}
                                        inline={settingsElements[key].accept({ accept: noop('accept'), pending: false })}
                                    />
                                })}
                            </List>
                        </Stack>
                    </div>
                    <div style={{ maxWidth: '480px' }}>
                        <List>
                            <ListItem icon={'duckplayer.png'} title={'While browsing the web'}
                                secondaryText={'Our tracker blocking eliminates most ads.'}>
                                <BeforeAfter onDone={() => alert('advance!')}
                                    btnAfter="See without tracker blocking"
                                    btnBefore="See with tracker blocking"
                                    imgBefore="./assets/img/steps/while-browsing-without.jpg"
                                    imgAfter="./assets/img/steps/while-browsing-with.jpg"
                                />
                            </ListItem>
                        </List>
                    </div>
                    <div style={{ width: '480px' }}>
                        <List>
                            <ListItem icon={'browsing.png'} title={'While browsing the web'} inline={<Check/>}/>
                            <ListItem icon={'duckplayer.png'} title={'While watching YouTube'}
                                secondaryText={'Enforce YouTube’s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.'}>
                                <BeforeAfter
                                    onDone={() => alert('advance!')}
                                    btnAfter="See without Duck Player"
                                    btnBefore="See with Duck Player"
                                    imgBefore="./assets/img/steps/without-duckplayer.jpg"
                                    imgAfter="./assets/img/steps/with-duckplayer.jpg"
                                />
                            </ListItem>
                        </List>
                    </div>
                    <div style={{ width: '480px' }}>
                        <Stack>
                            <List>
                                <ListItem icon={'browsing.png'} title={'While browsing the web'} inline={<Check/>}/>
                                <ListItem icon={'duckplayer.png'} title={'While watching YouTube'} inline={<Check/>}/>
                            </List>
                            <ButtonBar>
                                <Button onClick={() => alert('next page!')} size={'large'}>Next</Button>
                            </ButtonBar>
                        </Stack>
                    </div>
                    <Summary
                        title={i18n.en.translation.summary_title}
                        onDismiss={noop('onDismiss')}
                        onSettings={noop('onSettings')}
                        values={{
                            dock: { enabled: true },
                            'session-restore': { enabled: true }
                        }} />
                </Stack>
                <div style={{ height: '100px' }}/>
            </div>
            <div className={classNames(styles.foreground, styles.layer1)}/>
            <div className={classNames(styles.foreground, styles.layer2)}/>
            <div className={classNames(styles.foreground, styles.layer3)}/>
        </main>
    )
}
