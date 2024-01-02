import { h } from 'preact'
import { useTranslation } from '../translations'
import { Stack } from '../components/Stack'

export function Fallback () {
    const { t } = useTranslation()
    return (
        <Stack>
            <h1>{t('Something went wrong')}</h1>
            <p>{t('You can continue browsing as normal, or visit our ')}<a href="https://duckduckgo.com/help">{t('Help pages')}</a></p>
        </Stack>
    )
}
