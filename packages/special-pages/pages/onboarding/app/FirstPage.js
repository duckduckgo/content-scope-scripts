import { h, Fragment } from "preact";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";
import { useEffect, useRef, useState } from "preact/hooks";
import autoAnimate from "@formkit/auto-animate";

export function FirstPage({ onNextPage }) {
  const [completed, setCompleted] = useState(false);

  const pageParent = useRef(null);

  useEffect(() => {
    pageParent.current && autoAnimate(pageParent.current);
  }, [pageParent]);

  return (
    <>
      <Header
        title={"Welcome to DuckDuckGo!\nThe Internet is better\u00A0here."}
        onComplete={() => setCompleted(true)}
      />
      <div className={styles.wrapper} ref={pageParent}>
        {completed && (
          <button
            className={classNames(styles.primary, styles.large)}
            onClick={() => onNextPage()}
          >
            Get Started
          </button>
        )}
      </div>
    </>
  );
}
