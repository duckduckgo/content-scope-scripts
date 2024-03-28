import { html } from '../../../../../../src/dom-utils'

export function execTemplate (strings) {
    return html`
        <div class="full-container">
            <div class="warning-container">
                <h1 class="warning-header">
                    <img src="img/Shield-Alert-96x96.svg" alt="Warning" class="watermark">
                    ${strings.header}
                </h1>
                <p class="warning-text">${strings.body}</p>
                <div class="buttons">
                    <button class="button advanced" id="advancedBtn">${strings.advancedButton}</button>
                    <button class="button leave-this-site" id="leaveThisSiteBtn">${strings.leaveSiteButton}</button>
                </div>
            </div>
            <div class="advanced-info", id="advancedInfo">
                <p>${strings.advancedInfoHeader}</p>
                <p>${strings.specificMessage} ${strings.advancedInfoBody}</p>
                <a href="#" id="acceptRiskLink" class="accept-risk">${strings.visitSiteBody}</a>
                <p class="error-code">${strings.errorCode}</p>
            </div>
        </div>
    `
}
