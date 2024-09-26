import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useTypedTranslation } from '../../types'
import { GlobalContext } from '../../global'
import { PlainList } from '../../components/List'
import { ListItem } from '../../components/ListItem'
import { Check, BounceIn } from '../../components/Icons'
import { SlideIn } from './Animation'

export function ImportStep () {
    const { t } = useTypedTranslation()
    const { UIValues } = useContext(GlobalContext)

    const isIdle = UIValues.import === 'idle'

    return (
        <SlideIn>
            <PlainList>
                <ListItem
                    icon={'v3/bookmarks.svg'}
                    title={t('row_bookmarks-favorites_title_v3')}
                    secondaryText={t('row_bookmarks-favorites_desc_v3')}
                    inline={isIdle ? null : <BounceIn><Check/></BounceIn>}/>
                <ListItem
                    icon={'v3/key.svg'}
                    title={t('row_passwords_title')}
                    secondaryText={t('row_passwords_desc')}
                    inline={isIdle ? null : <BounceIn><Check/></BounceIn>}/>
            </PlainList>
        </SlideIn>
    )
}
