import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";

export function FirstPage({ onNextPage }) {
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setTimeout(() => setPageIndex(1), 2500);
  }, []);

  return (
    <>
      {pageIndex === 0 && <Header title="Welcome to DuckDuckGo!" />}
      {pageIndex === 1 && (
        <>
          <Header title={"Tired of being tracked\u00A0online?\nWe\u00A0can\u00A0help\u00A0💪"} />
          <div className={styles.wrapper}>
            <button
              className={classNames(styles.primary, styles.large)}
              onClick={() => onNextPage()}
            >
              Get Started
            </button>
          </div>
        </>
      )}
    </>
  );
}
