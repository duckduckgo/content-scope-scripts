import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import styles from "../src/js/styles.module.css";
import { StepsPages } from "./StepsPages";
import { FirstPage } from "./FirstPage";
import { LastPage } from "./LastPage";

// TODO probably should allow filtering steps by platform

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
        primaryFn: async () => {
          console.log("clicked");
          return true;
        },
      },
      {
        id: "block-cookies",
        title: "Block Cookies",
        icon: <div></div>,
        detail: "Blah blah",
        primaryLabel: "Block",
        primaryFn: async () => {
          console.log("clicked");
          return true;
        },
        secondaryLabel: "No thanks",
        secondaryFn: async () => {
          console.log("clicked no");
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
        id: "private-search2",
        title: "Private Search",
        icon: <div></div>,
        detail: "Blah blah",
        primaryLabel: "Got it!",
        primaryFn: async () => {
          console.log("clicked");
          return true;
        },
      },
      {
        id: "block-cookies2",
        title: "Block Cookies",
        icon: <div></div>,
        detail: "Blah blah",
        primaryLabel: "Block",
        primaryFn: async () => {
          console.log("clicked");
          return false; // actually turned off, probably by a native dialog
        },
        secondaryLabel: "No thanks",
        secondaryFn: async () => {
          console.log("clicked no");
          return false;
        },
      },
    ],
  },
];

export function App() {
  // TODO revert to 0
  const [pageIndex, setPageIndex] = useState(1);
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
          onNextPage={() => {}}
          stepsPages={stepsPages}
          stepResults={stepResults}
        />
      )}
    </main>
  );
}
