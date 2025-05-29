/**
 * @interface
 */
export class UIElement {
    /** @type {string} */
    kind;
}

/**
 * @typedef {ScreenTitleStatusElement
 *    | ScreenTitleElement
 *    | SectionTitleElement
 *    | TextRowElement
 *    | LinkRowElement
 *    | NearestLocationElement
 *    | PrivacyProElement
 *    | SyncElement
 *    | DescriptionLinkElement
 *    | CheckboxElement
 *    | RelatedElement
 *    | ButtonRowElement
 *    | SwitchElement
 *    | InlineWarningElement
 * } ElementDefinition
 */

/** @implements {UIElement} */
export class ScreenTitleStatusElement {
    /** @type {"ScreenTitleStatusElement"} */
    kind;
    /** @type {string} */
    id;
    /** @type {string|undefined} */
    valueId;
    /** @type {import('../elements/ScreenTitleStatus.js').ScreenTitleStatusDefinition} */
    props;
}

/** @implements {UIElement} */
export class ScreenTitleElement {
    /** @type {"ScreenTitleElement"} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/ScreenTitle.js').ScreenTitleDefinition} */
    props;
}

/** @implements {UIElement} */
export class SectionTitleElement {
    /** @type {"SectionTitleElement"} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/SectionTitle.js').SectionTitleProps} */
    props;
}

/** @implements {UIElement} */
export class TextRowElement {
    /** @type {'TextRowElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/TextRow.js').TextRowDefinition} */
    props;
}

/** @implements {UIElement} */
export class LinkRowElement {
    /** @type {'LinkRowElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/LinkRow.js').LinkRowDefinition} */
    props;
}

export class NearestLocationElement {
    /** @type {'NearestLocationElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {string[]} */
    strings;
}

/** @implements {UIElement} */
export class PrivacyProElement {
    /** @type {'PrivacyProElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {string[]} */
    strings;
}

/** @implements {UIElement} */
export class SyncElement {
    /** @type {'SyncElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {string[]} */
    strings;
    /** @type {string} */
    startId;
}

/** @implements {UIElement} */
export class DescriptionLinkElement {
    /** @type {'DescriptionLinkElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/DescriptionLink.js').DescriptionLinkDefinition} */
    props;
}

/** @implements {UIElement} */
export class CheckboxElement {
    /** @type {'CheckboxElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/Checkbox.js').CheckboxDefinition} */
    props;
    /** @type {ElementDefinition[] | undefined} */
    children;
}

/** @implements {UIElement} */
export class RelatedElement {
    /** @type {'RelatedElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {ElementDefinition[]} */
    children;
}

/** @implements {UIElement} */
export class ButtonRowElement {
    /** @type {'ButtonRowElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/ButtonRow.js').ButtonRowDefinition} */
    props;
}

/** @implements {UIElement} */
export class SwitchElement {
    /** @type {'SwitchElement'} */
    kind;
    /** @type {string} */
    id;
    /**
     * @type {string}
     * Maps to a global state value that determines which stack of elements to show - either 'on' or 'off'
     */
    valueId;
    /** @type {ElementDefinition[]} */
    on;
    /** @type {ElementDefinition[]} */
    off;
}

/** @implements {UIElement} */
export class InlineWarningElement {
    /** @type {'InlineWarningElement'} */
    kind;
    /** @type {string} */
    id;
    /** @type {import('../elements/InlineWarning.js').InlineWarningDefinition} */
    props;
}
