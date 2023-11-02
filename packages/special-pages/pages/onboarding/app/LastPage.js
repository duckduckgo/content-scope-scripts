import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";

export function LastPage({ onNextPage, onSettings, stepsPages, stepResults }) {
  const enabledSteps = stepsPages
    .reduce((arr, page) => {
      arr = [...arr, ...page.steps];
      return arr;
    }, [])
    .filter((step) => stepResults[step.id] === true);

  return (
    <>
      <Header title={"You're all\u00A0set!"} />

      <div className={styles.wrapper}>
        <h2>DuckDuckGo is customized and ready for you to start browsing privately.</h2>

        <ul className={styles.enabledSteps}>
          {enabledSteps.map((step) => (
            <li className={styles.enabledStep}>
                <span className={classNames(styles.status, styles.black)} />
                <div className={styles.icon} style={{backgroundImage: `url("assets/img/steps/${step.icon}-16.png")`}} />
                {step.title}
            </li>
          ))}
        </ul>

        <button
          className={classNames(styles.primary, styles.large)}
          onClick={() => onNextPage()}
        >
          Start Browsing
          <img src="assets/img/launch.svg" />
        </button>

        <div className={styles.settingsDisclaimer}>
          You can change your choices any time in <a onClick={() => onSettings()}>Settings</a>.
        </div>
      </div>
    </>
  );
}
