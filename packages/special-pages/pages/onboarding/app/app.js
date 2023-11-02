import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import styles from "../src/js/styles.module.css";
import { StepsPages } from "./StepsPages";
import { FirstPage } from "./FirstPage";
import { LastPage } from "./LastPage";
import { OnboardingMessages } from "../src/js/messages";

// TODO probably should allow filtering steps by platform

/**
 * @param {{messaging: OnboardingMessages}} props 
 */
export function App({messaging}) {

    const stepsPages = [
        {
          title: "What privacy protections\nshould we start you with?",
          bordered: true,
          steps: [
            {
              id: "private-search",
              title: "Private Search",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Got it!",
              primaryFn: () => true,
            },
            {
              id: "private-search",
              title: "Private Search",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Got it!",
              primaryFn: () => true,
            },
            {
              id: "private-search",
              title: "Private Search",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Got it!",
              primaryFn: () => true,
            },
            {
              id: "private-search",
              title: "Private Search",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Got it!",
              primaryFn: () => true,
            },
            {
              id: "block-cookies",
              title: "Block Cookies",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Block",
              primaryFn: () => {
                messaging.setBlockCookiePopups(true)
                return true;
              },
              secondaryLabel: "No thanks",
              secondaryFn: () => {
                messaging.setBlockCookiePopups(false)
                return false;
              },
            },
          ],
        },
        {
          title: "Personalize your experience",
          detail:
            "Here are a few more things you can do to make your browser work just the way you want.",
          steps: [
            {
              id: "another-step",
              title: "Another step",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Got it!",
              primaryFn: async () => true,
            },
            {
              id: "default-browser",
              title: "Default Browser",
              icon: <div></div>,
              detail: "Blah blah",
              primaryLabel: "Set as default",
              primaryFn: async () => await messaging.requestSetAsDefault(),
              secondaryLabel: "No thanks",
              secondaryFn: async () => false,
            },
          ],
        },
      ];
      

  // TODO revert to 0
  const [pageIndex, setPageIndex] = useState(0);
  const [stepResults, setStepResults] = useState({});

  return (
    <main className={styles.container}>
      {pageIndex === 0 && <FirstPage onNextPage={() => setPageIndex(1)} />}
      {pageIndex === 1 && (
        <StepsPages
          stepsPages={stepsPages}
          onNextPage={(stepResults) => {
            setPageIndex(2);
            setStepResults(stepResults);
          }}
        />
      )}
      {pageIndex === 2 && (
        <LastPage
          onNextPage={() => messaging.dismiss()}
          onSettings={() => messaging.dismissToSettings()}
          stepsPages={stepsPages}
          stepResults={stepResults}
        />
      )}
    </main>
  );
}
