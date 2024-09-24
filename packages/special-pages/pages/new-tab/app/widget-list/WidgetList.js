import { h, Fragment } from 'preact'
import { useVisibility, WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js'
import { useContext } from 'preact/hooks'

const widgetMap = {
    favorites: () => <Favorites/>,
    privacyStats: () => <PrivacyStats/>
}

export function WidgetList () {
    const { widgets, widgetConfig } = useContext(WidgetConfigContext)

    return (
        <div>
            {widgets.map((widget) => {
                const matchingConfig = widgetConfig.find(item => item.id === widget.id)
                if (!matchingConfig) {
                    console.warn('missing config for widget: ', widget)
                    return null
                }
                return (
                    <Fragment key={widget.id}>
                        <WidgetVisibilityProvider
                            visibility={matchingConfig.visibility}
                            id={matchingConfig.id}
                        >
                            {widgetMap[widget.id]?.()}
                        </WidgetVisibilityProvider>
                    </Fragment>
                )
            })}
        </div>
    )
}

function Favorites () {
    const { visibility, id, toggle } = useVisibility()
    return (
        <div>
            <p style={{ opacity: visibility === 'visible' ? '1' : '0.2' }}>Favorites Component</p>
            <code><b>{id} visibility: {visibility}</b></code>{' '}
            <button type={'button'} onClick={toggle}>Toggle Favorites</button>
        </div>
    )
}

function PrivacyStats () {
    const { visibility, id, toggle } = useVisibility()
    return (
        <div>
            <p style={{ opacity: visibility === 'visible' ? '1' : '0.2' }}>Privacy Stats Component</p>
            <code><b>{id} visibility: {visibility}</b></code>{' '}
            <button type={'button'} onClick={toggle}>Toggle Privacy Stats</button>
        </div>
    )
}
