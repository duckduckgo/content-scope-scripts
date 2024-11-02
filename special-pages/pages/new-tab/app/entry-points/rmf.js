import { h } from 'preact'
import { RMFConsumer } from '../remote-messaging-framework/RemoteMessagingFramework.js'
import { RMFProvider } from '../remote-messaging-framework/RMFProvider.js'

export function factory () {
    return (
        <RMFProvider>
            <RMFConsumer />
        </RMFProvider>
    )
}
