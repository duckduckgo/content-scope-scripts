export class Steps {
    get deselectAllButtonSelector() {
        return `${this.tabPanelSelector} div:nth-child(2) div:nth-child(2) button`;
    }

    get bookmarkModalSelector() {
        return 'fieldset.rcetic';
    }

    get bookmarkSelectButtonSelector() {
        return `${this.bookmarkModalSelector} input`;
    }

    get bookmarkDeselectAllButtonSelector() {
        return `${this.bookmarkModalSelector} div:nth-child(2) button:nth-of-type(2)`;
    }

    get chromeInputCheckboxSelector() {
        return `${this.tabPanelSelector} div:nth-child(10) input[type="checkbox"]`;
    }

    get chromeSectionSelector() {
        return 'c-wiz [data-id="chrome"]';
    }

    get chromeDataButtonSelector() {
        return `${this.tabPanelSelector} div:nth-child(10) > div:nth-child(2) > div:nth-child(2) button`;
    }

    get nextStepButtonSelector() {
        return `${this.tabPanelSelector} > div:nth-child(1) > div:nth-child(2) button`;
    }

    get createExportButtonSelector() {
        return 'div[data-configure-step="1"] button';
    }

    get tabPanelSelector() {
        return 'div[role="tabpanel"]';
    }

    get inputCheckboxSelector() {
        return `${this.tabPanelSelector} input[type="checkbox"]`;
    }

    get okButtonSelector() {
        return 'div[isfullscreen] div:nth-child(3) div:last-child[aria-disabled="false"]';
    }

    get bookmarkCheckboxSelector() {
        return `${this.bookmarkModalSelector} div:nth-child(3) > div:nth-of-type(2) input[checked]:not(:checked)`;
    }

    get bookmarkCheckboxCheckedSelector() {
        return `${this.bookmarkModalSelector} div:nth-child(3) > div:nth-of-type(2) input[checked]:checked`;
    }

    get manageButtonSelector() {
        return 'a[href="manage"]';
    }

    /**
     * @returns {Array<Record<string, any>>}
     */
    get actions() {
        return [
            {
                id: 'deselect-all-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.deselectAllButtonSelector,
                    },
                ],
            },
            {
                id: 'deselect-all-button-expectation',
                actionType: 'expectation',
                expectations: [
                    {
                        type: 'element',
                        selector: `${this.chromeInputCheckboxSelector}[checked]:not(:checked)`,
                    },
                ],
            },
            {
                id: 'chrome-section-scroll',
                actionType: 'scroll',
                selector: this.chromeSectionSelector,
            },
            {
                id: 'chrome-section-select',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: `${this.chromeInputCheckboxSelector}[checked]:not(:checked)`,
                    },
                ],
            },
            {
                id: 'chrome-data-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.chromeDataButtonSelector,
                    },
                ],
            },
            {
                id: 'bookmark-modal-expectation',
                actionType: 'expectation',
                expectations: [
                    {
                        type: 'element',
                        selector: this.bookmarkModalSelector,
                    },
                ],
            },
            {
                id: 'bookmark-deselect-all-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.bookmarkDeselectAllButtonSelector,
                    },
                ],
            },
            {
                id: 'bookmark-checkbox-expectation',
                actionType: 'expectation',
                expectations: [
                    {
                        type: 'element',
                        selector: this.bookmarkCheckboxSelector,
                    },
                ],
            },
            {
                id: 'bookmark-checkbox-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.bookmarkCheckboxSelector,
                    },
                ],
            },
            {
                id: 'ok-button-expectation',
                actionType: 'expectation',
                elements: [
                    {
                        type: 'element',
                        selector: this.okButtonSelector,
                    },
                ],
                expectations: [
                    {
                        type: 'element',
                        selector: this.okButtonSelector,
                    },
                    {
                        type: 'element',
                        selector: this.bookmarkCheckboxCheckedSelector,
                    },
                ],
            },
            {
                id: 'ok-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.okButtonSelector,
                    },
                ],
            },
            {
                id: 'next-step-button-scroll',
                actionType: 'scroll',
                elements: [
                    {
                        type: 'element',
                        selector: this.nextStepButtonSelector,
                    },
                ],
            },
            {
                id: 'next-step-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.nextStepButtonSelector,
                    },
                ],
            },
            {
                id: 'create-export-button-scroll',
                actionType: 'scroll',
                selector: this.createExportButtonSelector,
            },
            {
                id: 'create-export-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.createExportButtonSelector,
                    },
                ],
            },
            {
                id: 'manage-button-click',
                actionType: 'click',
                elements: [
                    {
                        type: 'element',
                        selector: this.manageButtonSelector,
                    },
                ],
            },
        ];
    }
}
