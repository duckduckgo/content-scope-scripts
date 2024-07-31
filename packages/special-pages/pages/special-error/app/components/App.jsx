import { h } from "preact";
import styles from "./App.module.css";
import { useTypedTranslation } from "../types.js";
import { Warning } from "./Warning";

export function App() {
    const { t } = useTypedTranslation()
    return (
        <main class={styles.main}>
            <Warning />
        </main>
    )
}

/** Legacy HTML
 *
 *         <div class="full-container" id="fullContainer" data-state="closed">
            <div class="warning-container">
                <h1 class="warning-header">
                    <img src="${shieldIcon}" alt="Warning" class="watermark">
                    ${strings.header}
                </h1>
                <p class="warning-text">${trustedUnsafeEscaped(strings.body)}</p>
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
 */