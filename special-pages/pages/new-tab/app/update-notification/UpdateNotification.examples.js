import { h } from 'preact'
import { UpdateNotification } from './UpdateNotification.js'
import { noop } from '../utils.js'

export const updateNotificationExamples = {
    empty: {
        factory: () => {
            return <UpdateNotification notes={[]} version={'1.2.3'} dismiss={noop('dismiss!')} />
        },
    },
    populated: {
        factory: () => {
            return <UpdateNotification notes={['Bug Fixed and Updates']} version={'1.2.3'} dismiss={noop('dismiss!')} />
        },
    },
}
