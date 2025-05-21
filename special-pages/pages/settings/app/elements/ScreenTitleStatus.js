import { ScreenTitle } from './ScreenTitle.js';
import { DetailedStatusIndicator } from './StatusIndicator.js';
import { Row } from './Row.js';
import { h } from 'preact';
import { useTranslation } from '../types.js';

/**
 * Props for the ScreenTitleStatus component
 * @typedef {Object} ScreenTitleStatusProps
 * @property {boolean} isOn - The status indicator state
 * @property {string} title - The screen title text
 * @property {string} onText - Text to display when status is on
 * @property {string} offText - Text to display when status is off
 */

/**
 * A component that renders a screen title with a status indicator
 * @param {ScreenTitleStatusProps} props - The component props
 */
export function ScreenTitleStatus({ isOn, title, onText, offText }) {
    const { t } = useTranslation();
    return (
        <Row gap={'small'}>
            <ScreenTitle title={t(title)}></ScreenTitle>
            <DetailedStatusIndicator isOn={isOn} description={isOn ? t(onText) : t(offText)} />
        </Row>
    );
}

/**
 * Builder class for creating ScreenTitleStatus props
 */
export class ScreenTitleStatusBuilder {
    /** @type {ScreenTitleStatusProps} */
    #props = {
        isOn: false,
        title: '',
        onText: '',
        offText: '',
    };

    /**
     * Creates a new ScreenTitleStatusBuilder
     * @returns {ScreenTitleStatusBuilder}
     */
    static create() {
        return new ScreenTitleStatusBuilder();
    }

    /**
     * Sets the status state
     * @param {boolean} isOn - The status indicator state
     * @returns {ScreenTitleStatusBuilder}
     */
    withStatus(isOn) {
        this.#props.isOn = isOn;
        return this;
    }

    /**
     * Sets the title text
     * @param {string} title - The screen title text
     * @returns {ScreenTitleStatusBuilder}
     */
    withTitle(title) {
        this.#props.title = title;
        return this;
    }

    /**
     * Sets the on status text
     * @param {string} onText - Text to display when status is on
     * @returns {ScreenTitleStatusBuilder}
     */
    withOnText(onText) {
        this.#props.onText = onText;
        return this;
    }

    /**
     * Sets the off status text
     * @param {string} offText - Text to display when status is off
     * @returns {ScreenTitleStatusBuilder}
     */
    withOffText(offText) {
        this.#props.offText = offText;
        return this;
    }

    /**
     * Builds the final props object
     * @returns {ScreenTitleStatusProps & { kind: 'ScreenTitleStatusProps', }}
     */
    build() {
        return { ...this.#props, kind: 'ScreenTitleStatusProps' };
    }
}
