import { h } from 'preact'
import { ComparisonTable } from './ComparisonTable'
import { SlideIn } from './Animation'

export function PrivateByDefaultStep () {
    return (
        <SlideIn>
            <ComparisonTable />
        </SlideIn>
    )
}
