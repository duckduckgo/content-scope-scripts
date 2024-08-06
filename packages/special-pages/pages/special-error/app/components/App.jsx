import { h } from "preact";
import { useErrorData, usePlatformName } from "../PageSettingsProvider";
import { SSLError } from "./SSLError";
import { PhishingWarning } from "./PhishingWarning";

import styles from "./App.module.css";

/**
 * @param {import("../../../../types/special-error.js").InitialSetupResponse['errorData']['kind']} kind
 */
function getSpecialErrorComponent(kind) {
    switch (kind) {
        case 'ssl':
            return SSLError;
        case 'phishing':
            return PhishingWarning;
        default:
            throw new Error(`Unhandled error page kind: ${kind}`)
    }
}

export function App() {
    const { kind } = useErrorData()
    const platformName = usePlatformName()
    const SpecialErrorComponent = getSpecialErrorComponent(kind)

    return (
        <main className={styles.main} data-platform={platformName}>
            <div className={styles.container}>
                <SpecialErrorComponent />
            </div>
        </main>
    )
}
