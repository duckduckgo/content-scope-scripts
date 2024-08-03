import ContentFeature from "../content-feature.js";

export default class CopyPasteMenuSelectionOverride extends ContentFeature {
    init () {
        try {
            (() => {
                var lastContextMenuEventX = -1;
                var lastContextMenuEventY = -1;
                var lastContextMenuEventWasPrevented = false;
                var isSelectionColorOverrideStyleAdded = false;

                // - Suppress alerts displayed on right click
                document.addEventListener('DOMContentLoaded', function () {
                    // add alert suppression script to page content world.
                    // use invisible `_ddg-suppress-alert-flag` element to pass `shouldSuppressAlert` value
                    // from client content world script handling `contextmenu` events.
                    var alertSuppressionScript = document.createElement('script');
                    alertSuppressionScript.textContent = `
                    (() => {
                        const flagElement = document.createElement('_ddg-suppress-alert-flag');
                        flagElement.style.display = 'none';
                        flagElement.setAttribute('value', 'false');
                        document.head.appendChild(flagElement);

                        function shouldSuppressAlert() {
                            return flagElement.getAttribute('value') === 'true';
                        }

                        const originalWindowAlert = window.alert;
                        // prevent websites displaying alerts on right click
                        window.alert = function(msg) {
                            if (shouldSuppressAlert()) {
                                console.log("suppressed alert on contextmenu: " + msg);
                            } else {
                                originalWindowAlert(msg);
                            }
                        };
                    })();
                    `;
                    document.head.appendChild(alertSuppressionScript);
                });

                // - Disable context menu prevention if user right-clicks at the same point for a second time
                document.addEventListener("contextmenu", function(e) {
                    if (lastContextMenuEventWasPrevented && e.clientX == lastContextMenuEventX && e.clientY == lastContextMenuEventY) {
                        // second same point click: disable next `contextmenu` event handlers
                        e.stopImmediatePropagation();
                        lastContextMenuEventWasPrevented = false;
                        return true;
                    }
                    // remember click position
                    lastContextMenuEventX = e.clientX;
                    lastContextMenuEventY = e.clientY;
                    // prevent websites displaying alerts on right click
                    const suppressAlertFlagElement = document.getElementsByTagName("_ddg-suppress-alert-flag")[0];
                    suppressAlertFlagElement.setAttribute('value', 'true');
                    // check if the context menu event handling was prevented
                    setTimeout(function() {
                        lastContextMenuEventWasPrevented = e.defaultPrevented;
                        // stop alerts suppression
                        suppressAlertFlagElement.setAttribute('value', 'false');
                    }, 0);

                    return true;
                }, true);

                // - Always cut/copy selected text
                function cutCopyHandler(e) {
                    const selectedText = window.getSelection().toString();
                    if (selectedText.trim().length > 0) {
                        // disable all custom `cut`/`copy` events handlers if there‘s text selected
                        e.stopImmediatePropagation();
                    }
                    return true;
                }
                document.addEventListener('copy', cutCopyHandler, true);
                document.addEventListener('cut', cutCopyHandler, true);

                // get key press event key number
                function keyCode(e) {
                    if (window.event) {
                        return window.event.keyCode;
                    } else {
                        return e.which;
                    }
                }

                // is there a selected text field?
                function isInputActive() {
                    let activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                        return true;
                    }
                    return false;
                }

                // - Fix custom Ctrl/Cmd + X/C/V handlers preventing cut/copy/paste
                document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey || e.metaKey) {
                        const key = keyCode(e);
                        // disable custom ctrl/cmd+x/c event handlers if there‘s text selected
                        if ((key == 67 /* C */ || key == 88 /* X */) && window.getSelection().toString().trim().length > 0) {
                            e.stopImmediatePropagation();

                        // disable custom ctrl/cmd+v event handlers if there‘s a text field selected
                        } else if (key == 86 /* V */ && isInputActive()) {
                            e.stopImmediatePropagation();
                        }
                    }
                    return true;
                }, true);

                // - Disable custom `paste` handlers when there‘s a text field selected
                document.addEventListener('paste', function(e) {
                    if (isInputActive()) {
                        e.stopImmediatePropagation();
                    }
                    return true;
                }, true);

                // - Disable selection start handlers - always allow text selection
                document.addEventListener('selectstart', function(e) {
                    e.stopImmediatePropagation();
                    return true;
                }, true);

                // add default selection color override CSS rule
                function addSelectionColorOverrideStyleIfNeeded() {
                    if (isSelectionColorOverrideStyleAdded) {
                        return;
                    }

                    isSelectionColorOverrideStyleAdded = true;
                    const styleElement = document.createElement('style');

                    // use default (highlight) selection color
                    const cssRules = `
                        *.__ddg-override-selection-background-color:not(input):not(textarea)::selection {
                            background-color: highlight !important;
                        }
                    `;
                    styleElement.textContent = cssRules;

                    document.head.appendChild(styleElement);
                }

                // helper function to enumerate all text nodes in selection range
                function forEachTextNodeInRange(range, callback) {
                    const startContainer = range.startContainer;
                    const endContainer = range.endContainer;

                    // helper function to enumerate all text nodes in a node
                    function enumerateTextNodes(node, callback) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            return callback(node);
                        } else {
                            for (let child = node.firstChild; child; child = child.nextSibling) {
                                if (enumerateTextNodes(child, callback) === false) {
                                    return false;
                                }
                            }
                        }
                    }

                    // get the common ancestor container of the range
                    const commonAncestorContainer = range.commonAncestorContainer;
                    // track whether the enumeration has got into the selection range
                    let inRange = false;

                    enumerateTextNodes(commonAncestorContainer, function(node) {
                        if (node === startContainer) {
                            inRange = true;
                        }
                        // stop enumeration when the selection range end node is reached
                        var shouldContinue = !(node === endContainer);
                        if (inRange) {
                            shouldContinue = callback(node) && shouldContinue;
                        }

                        return shouldContinue;
                    });
                }

                // - Override transparent text selection color resetting it to default selection color
                document.addEventListener('selectionchange', function(e) {
                    const selection = document.getSelection();
                    if (selection.rangeCount === 0) { return }
                    const range = selection.getRangeAt(0);

                    // enumerate all text nodes in selection
                    forEachTextNodeInRange(range, ((text) => {
                        const node = text.parentNode;
                        if (node.classList.contains('__ddg-override-selection-background-color')) {
                            return true; // selection color is already overriden – proceed next
                        }

                        const selectionColor = window.getComputedStyle(node, '::selection').backgroundColor;
                        // if text node selection color is set to `transparent` (0,0,0,0) or is not set explicitly - set it to default (`highlight`)
                        if (selectionColor === 'rgba(0, 0, 0, 0)' || selectionColor === 'transparent') {
                            addSelectionColorOverrideStyleIfNeeded();
                            // add default text selection color override CSS class to common ancestor node
                            node.classList.add('__ddg-override-selection-background-color');
                        }
                        return true; // next
                    }));

                    return true;
                }, true);

            })();
        } catch {
            // Throw away this exception, it's likely a confict with another extension
        }
    }
}
