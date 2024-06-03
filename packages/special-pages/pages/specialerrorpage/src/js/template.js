import { html, trustedUnsafeEscaped } from '../../../../../../src/dom-utils.js'
import shieldIcon from '../img/Shield-Alert-96x96.data.svg'

export function execTemplate (strings) {
    return html`
        <div class="full-container" id="fullContainer" data-state="closed">
            <div class="warning-container">
                <h1 class="warning-header">
                    <img src="${shieldIcon}" alt="Warning" class="watermark">
                    ${strings.header}
                </h1>
                <p class="warning-text">
                    ${trustedUnsafeEscaped(strings.body)}
                </p>
                <div class="buttons">
                    <button class="button advanced" id="advancedBtn">${strings.advancedButton}</button>
                    <button class="button leave-this-site" id="leaveThisSiteBtn">${strings.leaveSiteButton}</button>
                </div>
            </div>
            <div class="advanced-info closed">
                <p>${strings.advancedInfoHeader}</p>
                <p>${trustedUnsafeEscaped(strings.specificMessage)} ${trustedUnsafeEscaped(strings.advancedInfoBody)}</p>
                <button id="acceptRiskLink" class="accept-risk">${strings.visitSiteBody}</button>
            </div>
        </div>
    `
}
