import { h } from "preact";
import { usePlatformName, useErrorData } from "../providers/ErrorDataProvider";
import { UIProvider } from "../providers/UIProvider";
import { Warning, WarningHeading, WarningContent, AdvancedInfoButton, LeaveSiteButton } from "./Warning";
import { AdvancedInfo, AdvancedInfoHeading, AdvancedInfoContent, VisitSiteLink } from "./AdvancedInfo";
import { SpecialError } from "./App";
import { sampleData } from "../../src/js/sampleData";

import styles from "./Components.module.css";

/**
 * @typedef {Pick<import("../../../../types/special-error.js").InitialSetupResponse, "errorData" | "platform">} AppSettings
 */

/** @type {Record<Extract<AppSettings['platform']['name'], "macos"|"ios">, string>} */
const platforms = {
    'macos': 'macOS',
    'ios': 'iOS'
}

/**
 * @param {import("../../../../types/special-error.js").InitialSetupResponse['errorData']} errorData
 */
function idForError(errorData) {
    const { kind } = errorData
    if (kind === 'phishing') {
        return kind
    }

    const { errorType } = errorData
    return `${kind}.${errorType}`
}

export function Components() {
    const { platformName, updatePlatformName } = usePlatformName()
    const { errorData, updateErrorData } = useErrorData()

    const handlePlatformChange = (value) => {
        if (Object.keys(platforms).includes(value)) {
            updatePlatformName(value)
        }
    }

    const handleErrorTypeChange = (value) => {
        if (Object.keys(sampleData).includes(value)) {
            updateErrorData(sampleData[value].data)
        }
    }

    return (
        <div>
            <div className={styles.selector}>
                <fieldset>
                    <label for="platform-select">Platform:</label>
                    <select id="platform-select" onChange={(e) => handlePlatformChange(e.currentTarget?.value)}>
                        {Object.entries(platforms).map(([id, name]) => {
                            return <option value={id} selected={id === platformName}>{name}</option>
                        })}
                    </select>
                </fieldset>
                <fieldset>
                    <label for="error-select">Error Type:</label>
                    <select id="error-select" onChange={(e) => handleErrorTypeChange(e.currentTarget?.value)}>
                        {Object.entries(sampleData).map(([id, data]) => {
                            return <option value={id} selected={id === idForError(errorData)}>{data.name}</option>
                        })}
                    </select>
                </fieldset>
            </div>
            <main class={styles.main} data-platform-name={platformName}>
                <h1>Special Error Components</h1>

                <section>
                    <h2>Warning Heading</h2>
                    <div>
                        <WarningHeading />
                    </div>
                </section>

                <section>
                    <h2>Warning Content</h2>
                    <div>
                        <WarningContent />
                    </div>
                </section>

                <section>
                    <h2>Advanced Info Heading</h2>
                    <div>
                        <AdvancedInfoHeading />
                    </div>
                </section>

                <section>
                    <h2>Advanced Info Content</h2>
                    <div>
                        <AdvancedInfoContent />
                    </div>
                </section>

                <section>
                    <h2>Leave Site Button</h2>
                    <div>
                        <LeaveSiteButton />
                    </div>
                </section>

                <section>
                    <h2>Advanced Info Button</h2>
                    <div>
                        <AdvancedInfoButton />
                    </div>
                </section>

                <section>
                    <h2>Visit Site Link</h2>
                    <div>
                        <VisitSiteLink />
                    </div>
                </section>

                <section>
                    <h2>Warning</h2>
                    <div>
                        <Warning />
                    </div>
                </section>

                <section>
                    <h2>Advanced Info</h2>
                    <div>
                        <AdvancedInfo />
                    </div>
                </section>

                <section>
                    <h2>Special Error</h2>
                    <div>
                        <SpecialError />
                    </div>
                </section>
            </main>
        </div>
    )
}
