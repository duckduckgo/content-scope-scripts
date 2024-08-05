import { h } from "preact";
import classNames from "classnames";
import { useErrorData } from "../../../release-notes/app/ErrorDataProvider";
import { useEnv } from "../../../../shared/components/EnvironmentProvider";
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
    const { platform } = useEnv()
    const platformClass = platform === 'integration' ? 'apple' : platform
    const SpecialErrorComponent = getSpecialErrorComponent(kind)

    return (
        <main className={classNames(styles.main, styles[platformClass])}>
            <div className={styles.container}>
                <SpecialErrorComponent />
            </div>
        </main>
    )
}
