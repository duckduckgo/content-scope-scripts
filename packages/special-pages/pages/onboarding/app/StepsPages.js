import { h, Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import classNames from "classnames";
import styles from "../src/js/styles.module.css";
import { Header } from "./Header";
import autoAnimate from "@formkit/auto-animate";

function StepButtons({ step, handleStepButtonClick }) {
  return (
    <div className={styles.buttons}>
      {step.secondaryLabel && (
        <button
          className={styles.secondary}
          onClick={() => handleStepButtonClick(step.secondaryFn)}
        >
          {step.secondaryLabel}
        </button>
      )}
      {step.primaryLabel && (
        <button
          className={styles.primary}
          onClick={() => handleStepButtonClick(step.primaryFn)}
        >
          {step.primaryLabel}
        </button>
      )}
    </div>
  );
}

export function StepsPages({ stepsPages, onNextPage }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(-1);

  const [stepResults, setStepResults] = useState({});

  const stepsParent = useRef(null);
  const h2Parent = useRef(null);
  const buttonParent = useRef(null);
  const dummyStepParent = useRef(null);

  const page = stepsPages[pageIndex];
  const step = page.steps && page.steps[stepIndex];

  useEffect(() => {
    stepsParent.current && autoAnimate(stepsParent.current);
  }, [stepsParent]);
  useEffect(() => {
    h2Parent.current && autoAnimate(h2Parent.current);
  }, [h2Parent]);
  useEffect(() => {
    buttonParent.current && autoAnimate(buttonParent.current);
  }, [buttonParent]);
  useEffect(() => {
    dummyStepParent.current && autoAnimate(dummyStepParent.current);
  }, [dummyStepParent]);

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
      setStepIndex(-1);
      setTimeout(() => setPageIndex(pageIndex + 1), 250);
    } else {
      onNextPage(stepResults);
    }
  };

  const progress = stepsPages.length > 0 && (
    <div className={styles.progressContainer}>
      <div>
        {pageIndex + 1} / {stepsPages.length}
      </div>
      <progress max={stepsPages.length} value={pageIndex + 1}>
        (Page {pageIndex + 1} of circa {stepsPages.length})
      </progress>
    </div>
  );

  return (
    <>
      <Header
        title={page.title}
        aside={progress}
        onComplete={() => {
          setStepIndex(0);
        }}
      />

      <div className={styles.wrapper}>
        <div ref={h2Parent}>
          {stepIndex > -1 && page.detail && <h2>{page.detail}</h2>}
        </div>

{/* TODO delete */}
<div ref={dummyStepParent}>
        {page.dummyStep && stepIndex > -1 && <img src="assets/img/dummy-deleteme.png" style={{width: '100%', marginBottom: 16}} />}
        </div>
          
        {page.steps && <ul className={styles.steps} ref={stepsParent}>
          {page.steps.slice(0, stepIndex + 1).map((step, i) => (
            <li className={styles.stepContainer}>
              <div
                className={classNames(styles.step, {
                  [styles.completed]: stepIndex !== i,
                })}
              >
                <div
                  className={styles.icon}
                  style={{
                    backgroundImage: `url("assets/img/steps/${step.icon}-32-Shadow.png")`,
                  }}
                />

                <div className={styles.contentWrapper}>
                  <div className={styles.content}>
                    <h3>{step.title}</h3>
                    {stepIndex == i && <h4>{step.detail}</h4>}
                  </div>

                  {stepIndex == i && (
                    <StepButtons
                      step={step}
                      handleStepButtonClick={handleStepButtonClick}
                    />
                  )}
                </div>

                {step.secondaryLabel ? (
                  Object.prototype.hasOwnProperty.call(stepResults, step.id) ? (
                    <div
                      className={classNames(
                        styles.status,
                        styles.animated,
                        stepResults[step.id] === true
                          ? styles.success
                          : styles.skip
                      )}
                    />
                  ) : null
                ) : stepIndex == i ? (
                  <div
                    className={classNames(
                      styles.status,
                      styles.animated,
                      styles.success,
                      styles.alwaysOn
                    )}
                  >
                    Always On
                  </div>
                ) : (
                  <div className={classNames(styles.status, styles.success)} />
                )}
              </div>

              {stepIndex == i && (
                <StepButtons
                  step={step}
                  handleStepButtonClick={handleStepButtonClick}
                />
              )}
            </li>
          ))}
        </ul>}

        <div ref={buttonParent}>
          {(stepIndex === (page.steps ? page.steps.length : 0)) && (
            <button
              style={{ width: "100%" }}
              className={classNames(styles.primary, styles.large)}
              onClick={() => handleNextPageClick()}
            >
              Next
            </button>
          )}
        </div>
      </div>

      {progress}
    </>
  );
}
