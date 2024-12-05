import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { useMessaging } from '../types.js';
import { useEffect, useState } from 'preact/hooks';

export function factory() {
    return <Counter />;
}

function Counter() {
    /**
     * The state this entry-point will maintain
     */
    const [{ count, state }, setCount] = useState({ state: 'waiting', count: 0 });

    /**
     * This is how the Types are wired up. The schema files drive the types
     * that are accessed on `.notify`, `.subscribe` etc
     */
    const ntp = useMessaging();

    /**
     * fetch data and setup subscriptions
     */
    useEffect(() => {
        let sub;

        /**
         * First, get the initial payload - most widgets won't have a 'loading' state
         */
        // prettier-ignore
        ntp.messaging
            .request('counter_getData')
            .then((x) => {

                /**
                 * Here we have the first chunk of data, so we set-state to let the component render
                 */
                setCount({ state: 'ready', count: x.count });

                /**
                 * Now we can also subscribe to updates
                 */
                sub = ntp.messaging.subscribe('counter_onDataUpdate', (x) => {
                    setCount({ state: 'ready', count: x.count });
                });
            });

        return () => {
            /**
             * Make sure to clean up the subscription
             */
            sub?.unsubscribe();
        };
    }, []);

    return (
        <Centered>
            <div style={{ marginBlock: '1rem', border: '5px dotted pink' }}>
                <pre>
                    <code>{JSON.stringify({ count, state }, null, 2)}</code>
                </pre>
            </div>
        </Centered>
    );
}
