import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";

export function LastPage({ onNextPage, stepsPages, stepResults }) {
  const enabledSteps = stepsPages
    .reduce((arr, page) => {
      arr = [...arr, ...page.steps];
      return arr;
    }, [])
    .filter((step) => stepResults[step.id] === true);

  return (
    <>
      <Header title="You're all set!" />

      <div className={styles.wrapper}>
        <h2>DuckDuckGo is customized for you and ready to go.</h2>

        <ul>
          {enabledSteps.map((step) => (
            <li>{step.title}</li>
          ))}
        </ul>

        <button
          className={classNames(styles.primary, styles.large)}
          onClick={() => onNextPage()}
        >
          Start Browsing
        </button>

        <div>
          You can change your choices any time in <a href="#">Settings</a>.
        </div>
      </div>
    </>
  );
}
