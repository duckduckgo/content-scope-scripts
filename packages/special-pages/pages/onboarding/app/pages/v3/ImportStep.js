import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useTypedTranslation } from '../../types'
import { GlobalContext, GlobalDispatch } from '../../global'
import { PlainList } from '../../components/List'
import { ListItem } from '../../components/ListItem'
import { Check, BounceIn } from '../../components/Icons'
import { SingleSettingStep } from './SingleSettingStep'

export function ImportStep () {
    const { UIValues } = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)

    const { t } = useTypedTranslation()

    const isIdle = UIValues.import === 'idle'

    const dismissContent = () => isIdle ? t('skipButton') : null

    const acceptContent = () => isIdle ? t('importButton') : t('nextButton')
    const acceptHandler = () => {
        if (!isIdle) return null

        return () => dispatch({
            kind: 'update-system-value',
            id: 'import',
            payload: { enabled: true },
            current: true
        })
    }

    return (
        <SingleSettingStep
            dismissContent={dismissContent()}
            acceptContent={acceptContent()}
            acceptHandler={acceptHandler()}>
            <PlainList>
                <ListItem
                    icon={'v3/bookmarks.svg'}
                    title={t('bookmarksAndFavorites')}
                    secondaryText={t('bookmarksAndFavorites_description')}
                    inline={isIdle ? null : <BounceIn><Check/></BounceIn>}/>
                <ListItem
                    icon={'v3/key.svg'}
                    title={t('passwords')}
                    secondaryText={t('passwords_description')}
                    inline={isIdle ? null : <BounceIn><Check/></BounceIn>}/>
            </PlainList>
        </SingleSettingStep>
    )
}
