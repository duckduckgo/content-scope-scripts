import { h, Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";
import autoAnimate from '@formkit/auto-animate'

export function LastPage({ onSettings, stepsPages, stepResults }) {
  const [pageIndex, setPageIndex] = useState(-1);

  const pageParent = useRef(null)

  useEffect(() => {
    pageParent.current && autoAnimate(pageParent.current)
  }, [pageParent])

  const enabledSteps = stepsPages
    .reduce((arr, page) => {
      arr = [...arr, ...page.steps];
      return arr;
    }, [])
    .filter((step) => stepResults[step.id] === true);

  return (
    <div>
      <Header title={"You're all\u00A0set!"} onComplete={() => setPageIndex(0)} />

<div ref={pageParent}>
      {pageIndex === 0 && <div className={styles.wrapper}>
        <h2>DuckDuckGo is customized for you and ready&nbsp;to&nbsp;go.</h2>

        <ul className={styles.enabledSteps}>
          {enabledSteps.map((step) => (
            <li className={styles.enabledStep}>
              <span className={classNames(styles.status, styles.black)} />
              <div className={styles.icon} style={{ backgroundImage: `url("assets/img/steps/${step.icon}-16.png")` }} />
              {step.title}
            </li>
          ))}
        </ul>

        <button
          className={classNames(styles.primary, styles.large)}
          onClick={() => setPageIndex(1)}
        >
          Start Browsing
          <img src="assets/img/launch.svg" />
        </button>

        <div className={styles.settingsDisclaimer}>
          You can change your choices any time in <a onClick={() => onSettings()}>Settings</a>.
        </div>
      </div>}

      {pageIndex === 1 && <div className={styles.wrapper}>
        <h2>Try visiting one of your favorite sites.</h2>
        <h2>Remember, DuckDuckGo will be blocking trackers so they can’t spy on you.</h2>
      </div>}
      </div>
    </div>
  );
}
