/**
 * A builder-pattern API for creating screen definitions
 */
export class Pane {
    /**
     * @param {string} id - The screen identifier
     */
    constructor(id) {
        this.definition = {
            /** @type {string} */
            id,
            /** @type {import("../settings.service").ElementDefinition[]} */
            elements: [],
            /** @type {import("../settings.service").ElementDefinition[][]} */
            sections: [],
            /** @type {import("../settings.service").ElementDefinition | null} */
            title: null,
        };
    }

    /**
     * Sets the title of the screen
     * @param {string} title - The translation key for the title
     * @returns {Pane} - The builder instance for chaining
     */
    withTitle(title) {
        const titleId = `${this.definition.id}.titleStatus`;

        this.definition.title = {
            id: titleId,
            kind: 'ScreenTitleDefinition',
            props: {
                title,
            },
        };

        return this;
    }

    /**
     * Sets the title of the screen
     * @param {object} props
     * @param {string} props.title - The translation key for the title
     * @param {string} props.valueId - The translation key for the title
     * @param {string} props.onText
     * @param {string} props.offText
     * @returns {Pane} - The builder instance for chaining
     */
    withTitleStatus({ title, valueId, onText, offText }) {
        const titleId = `${this.definition.id}.titleStatus`;

        this.definition.title = {
            id: titleId,
            kind: 'ScreenTitleStatusDefinition',
            valueId,
            props: {
                title,
                onText,
                offText,
            },
        };

        return this;
    }

    /**
     * Adds a custom element with specified kind and props
     * @param {import("../settings.service").ElementDefinition | { build(): import("../settings.service").ElementDefinition }} element
     * @returns {Pane} - The builder instance for chaining
     */
    addElement(element) {
        if ('kind' in element) {
            this.definition.elements.push(element);
        }
        if ('build' in element && typeof element.build === 'function') {
            this.definition.elements.push(element.build());
        }
        return this;
    }

    /**
     * Builds and returns the final screen definition
     * @returns {Record<string, import("../settings.service").ScreenDefinition>} - The complete screen definition
     */
    build() {
        if (this.definition.title === null) throw new Error('unreachable - must have added a title');

        /** @type {Record<string, import("../settings.service").ScreenDefinition>} */
        const result = {};
        result[this.definition.id] = {
            id: this.definition.id,
            title: this.definition.title,
            elements: this.definition.elements,
            sections: this.definition.sections,
        };
        return result;
    }
}

export class ButtonBuilder {
    /**
     * @param {object} props
     * @param {string} props.id
     * @param {string} props.text
     */
    constructor({ id, text }) {
        this.id = id;
        this.text = text;
    }

    /**
     * @return {import("../settings.service").ElementDefinition}
     */
    build() {
        return {
            kind: 'ButtonRowDefinition',
            id: this.id,
            props: {
                text: this.text,
            },
        };
    }
}

export class DescriptionLink {
    /**
     * @param {object} props
     * @param {string} [props.id] optional ID - one will be generated if not provided
     * @param {string} props.description
     * @param {string} props.linkText
     */
    constructor({ id, description, linkText }) {
        this.id = id;
        this.description = description;
        this.linkText = linkText;
    }

    /**
     * @return {import("../settings.service").ElementDefinition}
     */
    build() {
        return {
            kind: 'DescriptionLinkDefinition',
            id: this.id || uuid(),
            props: {
                description: this.description,
                linkText: this.linkText,
            },
        };
    }
}

export class Checkbox {
    /**
     * @param {object} props
     * @param {string} props.id
     * @param {string} props.text
     */
    constructor({ id, text }) {
        this.id = id;
        this.text = text;
    }

    /**
     * @return {import("../settings.service").ElementDefinition}
     */
    build() {
        return {
            kind: 'CheckboxDefinition',
            id: this.id,
            props: {
                text: this.text,
            },
        };
    }
}

export class SectionTitle {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {string} props.title
     */
    constructor({ id, title }) {
        this.id = id;
        this.title = title;
    }

    /**
     * @return {import("../settings.service").ElementDefinition}
     */
    build() {
        return {
            kind: 'SectionTitleProps',
            id: this.id || uuid(),
            props: {
                title: this.title,
            },
        };
    }
}

export class Custom {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {'NearestLocation' | 'PrivacyPro'} props.elementKind
     */
    constructor({ id, elementKind }) {
        this.id = id;
        this.elementKind = elementKind;
    }

    /**
     * @return {import("../settings.service").ElementDefinition}
     */
    build() {
        switch (this.elementKind) {
            case 'PrivacyPro': {
                return {
                    kind: this.elementKind,
                    id: this.id || uuid(),
                    strings: [],
                };
            }
            case 'NearestLocation': {
                return {
                    kind: this.elementKind,
                    id: this.id || uuid(),
                    strings: [],
                };
            }
        }
    }
}

/**
 * Generate RFC4122 v4 UUID using crypto API
 * @returns {string} UUID string
 */
function uuid() {
    const crypto = globalThis.crypto;
    if (!crypto) {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
/**
 * @param {keyof import('../../public/locales/en/settings.json')} t
 * @return {string}
 */
export function UserText(t) {
    return t;
}

/**
 * Helper factory function to create a screen builder
 * @param {string} id - The screen identifier
 * @returns {Pick<Pane, 'withTitle' | 'withTitleStatus'>} - A new screen builder instance
 */
export function pane(id) {
    return new Pane(id);
}

export const api = {
    pane,
    DescriptionLink,
    Checkbox,
    UserText,
    ButtonBuilder,
    SectionTitle,
    Custom,
};

function demo() {
    const _pane = pane('privateSearch').withTitle('Private Search').build();
    const _pane2 = pane('vpn')
        .withTitleStatus({
            onText: 'status_on',
            title: 'vpn.screenTitle',
            valueId: 'vpn.enabled',
            offText: 'status_off',
        })
        .addElement(new ButtonBuilder({ id: 'vpn.location.enableButton', text: 'vpn.enable_button' }))
        .addElement(new SectionTitle({ id: 'vpn.location.nearestLocation', title: 'vpn.location.section_title' }))
        .build();
    console.log(JSON.stringify({ panes: [_pane, _pane2] }, null, 2));
}

demo();
