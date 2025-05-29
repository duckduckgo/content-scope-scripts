/**
 * @import { PaneDefinition } from "./pane-types.js"
 * @import { ElementDefinition } from "./element-types.js"
 */

/**
 * A builder-pattern API for creating screen definitions
 */
export class PaneBuilder {
    /**
     * @param {string} id - The screen identifier
     */
    constructor(id) {
        /** @type {{ id: string; elements: ElementDefinition[]; sections: ElementDefinition[][]; title: ElementDefinition | null; icon: string | null}} */
        this.definition = {
            id,
            elements: [],
            sections: [],
            title: null,
            icon: null,
        };
    }

    /**
     * @param {string} path
     */
    icon(path) {
        this.definition.icon = path;
        return this;
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
            kind: 'ScreenTitleElement',
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
            kind: 'ScreenTitleStatusElement',
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
     * @returns {Record<string, import("./pane-types.js").PaneDefinition>} - The complete screen definition
     */
    build() {
        if (this.definition.title === null) throw new Error('unreachable - must have added a title');

        /** @type {Record<string, import("./pane-types.js").PaneDefinition>} */
        const result = {};
        result[this.definition.id] = {
            id: this.definition.id,
            title: this.definition.title,
            elements: this.definition.elements,
            sections: this.definition.sections,
            icon: this.definition.icon || '',
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
            kind: 'ButtonRowElement',
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
            kind: 'DescriptionLinkElement',
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
            kind: 'SwitchElement',
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
        this.childElements = [];
    }

    /**
     * @param {(ElementDefinition|{build(): ElementDefinition })[]} children
     */
    withChildren(children) {
        for (const child of children) {
            this.childElements.push('build' in child ? child.build() : child);
        }
        return this;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'CheckboxElement',
            id: this.id,
            children: this.childElements,
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
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'SectionTitleElement',
            id: this.id || uuid(),
            props: {
                title: this.title,
            },
        };
    }
}

export class Related {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {(ElementDefinition|{build(): ElementDefinition })[]} props.children
     */
    constructor({ id, children }) {
        this.id = id;
        this.children = children;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        const next = [];
        for (const child of this.children) {
            next.push('build' in child ? child.build() : child);
        }
        return {
            kind: 'RelatedElement',
            id: this.id || uuid(),
            children: next,
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
            kind: 'TextRowElement',
            id: this.id || uuid(),
            props: {
                text: this.text,
            },
        };
    }
}

export class InlineWarning {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {string} props.text
     * @param {string} props.buttonText
     */
    constructor({ id, text, buttonText }) {
        this.id = id;
        this.text = text;
        this.buttonText = buttonText;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'InlineWarningElement',
            id: this.id || uuid(),
            props: {
                text: this.text,
                buttonText: this.buttonText,
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
            kind: 'LinkRowElement',
            id: this.id || uuid(),
            props: {
                text: this.text,
            },
        };
    }
}

export class PrivacyPro {
    /**
     * @param {object} props
     * @param {string} [props.id]
     */
    constructor({ id }) {
        this.id = id;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'PrivacyProElement',
            id: this.id || uuid(),
            strings: [],
        };
    }
}

export class NearestLocation {
    /**
     * @param {object} props
     * @param {string} [props.id]
     */
    constructor({ id }) {
        this.id = id;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'NearestLocationElement',
            id: this.id || uuid(),
            strings: [],
        };
    }
}
export class Sync {
    /**
     * @param {object} props
     * @param {string} [props.id]
     * @param {string} props.startId
     * @param {string[]} props.strings
     */
    constructor({ id, startId, strings }) {
        this.id = id;
        this.startId = startId;
        this.strings = strings;
    }

    /**
     * @return {ElementDefinition}
     */
    build() {
        return {
            kind: 'SyncElement',
            id: this.id || uuid(),
            strings: this.strings,
            startId: this.startId,
        };
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
    Related = Related;
    PrivacyPro = PrivacyPro;
    NearestLocation = NearestLocation;
    Sync = Sync;
    Switch = Switch;
    InlineWarning = InlineWarning;
    Value = Value;
    Text = TextRow;
    Link = LinkRow;
}
