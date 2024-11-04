/**
 * @type {import("../../../types/new-tab").Widgets}
 */
const widgets = [{ id: 'weatherWidget' }, { id: 'newsWidget' }]

/**
 * @type {import("../../../types/new-tab").WidgetListItem}
 */
const widget = { id: 'newsWidget' }

/**
 * @type {import("../../../types/new-tab").WidgetConfigs}
 */
const widgetConfigs = [
    { id: 'weatherWidget', visibility: 'visible' },
    { id: 'newsWidget', visibility: 'visible' },
]

/**
 * @type {import("../../../types/new-tab").WidgetConfigItem}
 */
const widgetConfig = {
    id: 'weatherWidget',
    visibility: 'visible',
}

/**
 * Widgets + WidgetConfigs when delivered in first payload...
 *
 * @type {import("../../../types/new-tab").InitialSetupResponse}
 */
const initialSetupResponse = {
    widgets: [{ id: 'updateNotification' }, { id: 'rmf' }, { id: 'favorites' }, { id: 'privacyStats' }],
    widgetConfigs: [
        { id: 'favorites', visibility: 'visible' },
        { id: 'privacyStats', visibility: 'visible' },
    ],
    env: 'production',
    locale: 'en',
    platform: { name: 'windows' },
    updateNotification: { content: null },
}

export {}
