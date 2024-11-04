import { h } from 'preact'
import { UpdateNotificationConsumer } from '../update-notification/UpdateNotification.js'
import { UpdateNotificationProvider } from '../update-notification/UpdateNotificationProvider.js'

export function factory () {
    return (
        <UpdateNotificationProvider>
            <UpdateNotificationConsumer />
        </UpdateNotificationProvider>
    )
}
