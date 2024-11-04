import { h } from 'preact'
import { PrivacyStatsCustomized } from '../privacy-stats/PrivacyStats.js'
import { Centered } from '../components/Layout.js'

export function factory () {
    return (
        <Centered>
            <PrivacyStatsCustomized />
        </Centered>
    )
}
