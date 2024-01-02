import { Header } from '../components/Header'
import { h } from 'preact'
import { Stack } from '../components/Stack'
import { Button } from '../components/Buttons'
import { Content } from '../components/Content'
import { useRollin } from '../hooks/useRollin'
import { useTranslation } from '../translations'

/**
 * Renders the first page of the application and provides an option to move to the next page.
 *
 * @param {Object} props - The component props.
 * @param {() => void} props.onNextPage - Callback function to be called when the "Get Started" button is clicked.
 * @param {string} props.title
 */
export function Welcome ({ onNextPage, title }) {
    return (
        <Header
            title={title}
            onComplete={() => setTimeout(onNextPage, 1000)}
        />
    )
}

/**
 * Renders the first page of the application and provides an option to move to the next page.
 *
 * @param {Object} props - The component props.
 * @param {() => void} props.onNextPage - Callback function to be called when the "Get Started" button is clicked.
 * @param {string} props.title
 */
export function WeCanHelp ({ onNextPage, title }) {
    const { state, advance } = useRollin(['start-trigger'])
    const { t } = useTranslation()

    return (
        <Stack>
            <Header
                title={title}
                onComplete={advance}
            />
            <Content>
                {state.current > 0 && (
                    <Button onClick={onNextPage} size={'large'}>
                        {t('Get Started!')}
                    </Button>
                )}
            </Content>
        </Stack>
    )
}
