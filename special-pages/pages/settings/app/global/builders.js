/**
 * @import { ElementDefinition } from "../settings.service"
 */
/**
 * A builder-pattern API for creating screen definitions
 */
export class PaneBuilder {
    /**
     * @param {string} id - The screen identifier
     */
    constructor(id) {
        this.definition = {
            /** @type {string} */
            id,
            /** @type {ElementDefinition[]} */
            elements: [],
            /** @type {ElementDefinition[][]} */
            sections: [],
            /** @type {ElementDefinition | null} */
            title: null,
        };
    }

    /**
     * Sets the title of the screen
     * @param {string} title - The translation key for the title
     * @returns {PaneBuilder} - The builder instance for chaining
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
     * @param {string} [props.valueId] - The translation key for the title
     * @param {string} props.onText
     * @param {string} props.offText
     * @returns {PaneBuilder} - The builder instance for chaining
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
     * @param {ElementDefinition | { build(): ElementDefinition }} element
     * @returns {PaneBuilder} - The builder instance for chaining
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
     * Adds a custom element with specified kind and props
     * @param {(ElementDefinition | { build(): ElementDefinition })[]} elements
     * @returns {PaneBuilder} - The builder instance for chaining
     */
    addSection(elements) {
        const next = [];
        for (const element of elements) {
            if ('kind' in element) {
                next.push(element);
            }
            if ('build' in element && typeof element.build === 'function') {
                next.push(element.build());
            }
        }
        this.definition.sections.push(next);
        return this;
    }

    /**
     * Builds and returns the final screen definition
     * @returns {Record<string, import("../settings.service").PaneDefinition>} - The complete screen definition
     */
    build() {
        if (this.definition.title === null) throw new Error('unreachable - must have added a title');

        /** @type {Record<string, import("../settings.service").PaneDefinition>} */
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
     * @return {ElementDefinition}
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
     * @return {ElementDefinition}
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

export class Switch {
    /**
     * @param {object} props
     * @param {string} [props.id] optional ID - one will be generated if not provided
     * @param {string} props.valueId - The value to switch on, must be a boolean
     * @param {(ElementDefinition|{build(): ElementDefinition })[]} props.on
     * @param {(ElementDefinition|{build(): ElementDefinition })[]} props.off
     */
    constructor({ id, valueId, on, off }) {
        this.id = id;
        this.valueId = valueId;
        this.on = on;
        this.off = off;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'SwitchDefinition',
            id: this.id || uuid(),
            valueId: this.valueId,
            on: this.on.map((x) => ('build' in x ? x.build() : x)),
            off: this.off.map((x) => ('build' in x ? x.build() : x)),
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
        /** @type {ElementDefinition[]} */
        this.children = [];
    }

    /**
     * @param {(ElementDefinition|{build(): ElementDefinition })[]} children
     */
    withChildren(children) {
        for (const child of children) {
            this.children.push('build' in child ? child.build() : child);
        }
        return this;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'CheckboxDefinition',
            id: this.id,
            props: {
                text: this.text,
                children: this.children,
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
     * @return {ElementDefinition}
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

export class TextRow {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {string} props.text
     */
    constructor({ id, text }) {
        this.id = id;
        this.text = text;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'TextRowDefinition',
            id: this.id || uuid(),
            props: {
                text: this.text,
            },
        };
    }
}

export class LinkRow {
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
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'LinkRowDefinition',
            id: this.id || uuid(),
            props: {
                text: this.text,
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
     * @return {ElementDefinition}
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
 * @param {Record<string, any>} [data]
 * @return {string}
 */
export function UserText(t, data = {}) {
    // console.log('data:', data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _v = data;
    return t;
}

/**
 * @template {string} T
 * @param {T} t
 * @return {{id: T}}
 */
export function Value(t) {
    return { id: t };
}

/**
 * Helper factory function to create a screen builder
 * @param {string} id - The screen identifier
 * @returns {Pick<PaneBuilder, 'withTitle' | 'withTitleStatus'>} - A new screen builder instance
 */
export function pane(id) {
    return new PaneBuilder(id);
}

export class Api {
    pane = pane;
    DescriptionLink = DescriptionLink;
    Checkbox = Checkbox;
    UserText = UserText;
    Button = ButtonBuilder;
    SectionTitle = SectionTitle;
    Custom = Custom;
    Switch = Switch;
    Value = Value;
    Text = TextRow;
    Link = LinkRow;
}
