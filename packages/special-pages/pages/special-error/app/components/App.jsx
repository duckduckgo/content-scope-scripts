import { h } from "preact";
import { usePlatformName } from "../AppSettingsProvider";
import { Warning } from "./Warning";
import { AdvancedInfo } from "./AdvancedInfo";
import { useAdvancedInfo } from "../UIProvider";

import styles from "./App.module.css";

export function SpecialError() {
    const { showAdvancedInfo } = useAdvancedInfo()

    return (
        <div className={styles.container}>
            <Warning />
            { showAdvancedInfo && <AdvancedInfo />}
        </div>
    )
}

export function App() {
    const { platformName } = usePlatformName()

    return (
        <main className={styles.main} data-platform={platformName}>
            <SpecialError />
        </main>
    )
}
