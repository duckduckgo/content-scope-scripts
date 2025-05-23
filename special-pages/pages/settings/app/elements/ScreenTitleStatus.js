import { ScreenTitle } from './ScreenTitle.js';
import { DetailedStatusIndicator } from './StatusIndicator.js';
import { Row } from './Row.js';
import { h } from 'preact';
import { useTranslation } from '../types.js';
import { useGlobalSettingsState } from '../global/Providers/SettingsServiceProvider.js';
import { useComputed } from '@preact/signals';

/**
 * Props for the ScreenTitleStatus component
 * @typedef {Object} ScreenTitleStatusDefinition
 * @property {string} title - The screen title text
 * @property {string} onText - Text to display when status is on
 * @property {string} offText - Text to display when status is off
 */

/**
 * Props for the ScreenTitleStatus component
 * @import { Signal } from '@preact/signals';
 * @typedef {Object} ScreenTitleStatusProps
 * @property {Signal<boolean>} isOn - The status indicator state
 */

/**
 * A component that renders a screen title with a status indicator
 * @param {ScreenTitleStatusDefinition & ScreenTitleStatusProps} props - The component props
 */
export function ScreenTitleStatus({ isOn, title, onText, offText }) {
    const { t } = useTranslation();
    return (
        <Row gap={'small'}>
            <ScreenTitle title={t(title)}></ScreenTitle>
            <DetailedStatusIndicator isOn={isOn} description={isOn.value ? t(onText) : t(offText)} />
        </Row>
    );
}

/**
 * @param {ScreenTitleStatusDefinition & { id: string, valueId?: string }} props
 */
export function ScreenTitleStatusWithState({ id, valueId, ...rest }) {
    const results = useGlobalSettingsState();
    const globalValue = useComputed(() => results.value[valueId || id]);
    return <ScreenTitleStatus {...rest} isOn={globalValue} />;
}
