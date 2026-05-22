import styles from './v3/App.module.css';
import { Stack } from './shared/components/Stack';
import { SingleLineProgress } from './shared/components/Progress';
import { Launch, Replay } from './shared/components/Icons';
import { ElasticButton } from './v3/components/ElasticButton';
import { ButtonBar } from './v3/components/Buttons';
import { h } from 'preact';
import { Background } from './v3/components/Background';
import { Switch } from '../../../shared/components/Switch/Switch.js';
import { ComparisonTable } from './v3/components/ComparisonTable';
import { Heading } from './v3/components/Heading';
import { Hiker } from './v3/components/Hiker';

function noop(name) {
    return () => {
        console.log('clicked ' + name);
    };
}

export function Components() {
    return (
        <main className={styles.main} data-app-version="2">
            <Background />
            <div class={styles.container}>
                <Stack gap="var(--sp-8)">
                    <p>
                        <a href="?env=app">Onboarding Flow</a>
                    </p>

                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>V3 Components</h2>

                    <Heading title={'Welcome to DuckDuckGo!'} />
                    <Heading title={'Welcome to DuckDuckGo!'} subtitle={"Let's get you set up..."} />
                    <Heading title={'Welcome to DuckDuckGo!'} subtitle={"Let's get you set up..."}>
                        <ElasticButton text={'Next'} elastic={true} />
                    </Heading>

                    <Heading title={'Welcome to DuckDuckGo!'} speechBubble={true} />
                    <Heading title={'Welcome to DuckDuckGo!'} subtitle={"Let's get you set up..."} speechBubble={true} />
                    <Heading title={'Welcome to DuckDuckGo!'} speechBubble={true}>
                        <ElasticButton text={'Next'} elastic={true} />
                    </Heading>

                    <SingleLineProgress current={2} total={5} />

                    <ComparisonTable />

                    <ButtonBar>
                        <ElasticButton variant={'secondary'} text={'Skip'} elastic={false} />
                        <ElasticButton variant={'secondary'} text={'Replay'} startIcon={<Replay />} elastic={false} />
                        <ElasticButton variant={'secondary'} text={'Replay'} endIcon={<Replay direction={'forward'} />} elastic={false} />
                    </ButtonBar>

                    <ButtonBar>
                        <ElasticButton text={'Next'} elastic={true} />
                        <ElasticButton text={'Start Browsing'} startIcon={<Launch />} elastic={true} />
                        <ElasticButton text={'Start Browsing'} endIcon={<Launch />} elastic={true} />
                    </ButtonBar>

                    <div style={{ position: 'relative', overflow: 'hidden', width: '400px', height: '400px' }}>
                        <Hiker />
                    </div>

                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Switches</h2>
                    <div>
                        <p>On Light</p>
                        <AllSwitches theme={'light'} />
                    </div>
                    <div>
                        <p>On Dark</p>
                        <div style="background: #333; padding: 1rem;">
                            <AllSwitches theme={'dark'} />
                        </div>
                    </div>
                </Stack>
                <div style={{ height: '100px' }} />
            </div>
        </main>
    );
}

/**
 * @param {object} props
 * @param {'light' | 'dark'} props.theme
 */
function AllSwitches({ theme = 'light' }) {
    return (
        <ButtonBar>
            <Switch
                pending={false}
                ariaLabel={'op'}
                checked={true}
                onChecked={noop('onChecked')}
                onUnchecked={noop('onUnchecked')}
                platformName={'macos'}
                theme={theme}
            />
            <Switch
                pending={false}
                ariaLabel={'op'}
                checked={false}
                onChecked={noop('onChecked')}
                onUnchecked={noop('onUnchecked')}
                platformName={'macos'}
                theme={theme}
            />
            <Switch
                pending={false}
                ariaLabel={'op'}
                platformName={'windows'}
                checked={true}
                onChecked={noop('onChecked')}
                onUnchecked={noop('onUnchecked')}
                theme={theme}
            />
            <Switch
                pending={false}
                ariaLabel={'op'}
                platformName={'windows'}
                checked={false}
                onChecked={noop('onChecked')}
                onUnchecked={noop('onUnchecked')}
                theme={theme}
            />
        </ButtonBar>
    );
}
