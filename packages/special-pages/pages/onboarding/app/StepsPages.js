import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";

export function StepsPages({ stepsPages, onNextPage }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const [stepResults, setStepResults] = useState({});

  const page = stepsPages[pageIndex];
  const step = page.steps[stepIndex];

  const handleStepButtonClick = async (handler) => {
    const result = await handler();

    setStepResults({
      ...stepResults,
      [step.id]: result,
    });

    if (stepIndex + 1 <= page.steps.length) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleNextPageClick = () => {
    if (pageIndex + 1 < stepsPages.length) {
      setPageIndex(pageIndex + 1);
      setStepIndex(0);
    } else {
      onNextPage(stepResults);
    }
  };

  return (
    <>
      <Header
        title={page.title}
        progressMax={stepsPages.length}
        progressValue={pageIndex}
      />

      <div className={styles.wrapper}>
        <h2>{page.detail}</h2>

        <ul className={styles.steps}>
          {page.steps.slice(0, stepIndex + 1).map((step, i) => (
            <li className={styles.step}>
              <img />

              <div className={styles.contentWrapper}>
                <div className={styles.content}>
                  <h3>{step.title}</h3>
                  {stepIndex == i && <h4>{step.detail}</h4>}
                </div>

                {stepIndex == i && (
                  <div className={styles.buttons}>
                    {step.primaryLabel && (
                      <button
                        className={styles.primary}
                        onClick={() => handleStepButtonClick(step.primaryFn)}
                      >
                        {step.primaryLabel}
                      </button>
                    )}
                    {step.secondaryLabel && (
                      <button
                        className={styles.secondary}
                        onClick={() => handleStepButtonClick(step.secondaryFn)}
                      >
                        {step.secondaryLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {step.secondaryLabel ? (
                <div
                  className={classNames(
                    styles.status,
                    stepResults[step.id] === true ? styles.success : styles.skip
                  )}
                />
              ) : stepIndex == i ? (
                <div
                  className={classNames(
                    styles.status,
                    styles.success,
                    styles.alwaysOn
                  )}
                >
                  Always On
                </div>
              ) : (
                <div className={classNames(styles.status, styles.success)} />
              )}
            </li>
          ))}
        </ul>

        {stepIndex === page.steps.length && (
          <button
            className={classNames(styles.primary, styles.large)}
            onClick={() => handleNextPageClick()}
          >
            Next
          </button>
        )}
      </div>
    </>
  );
}
