import { h, Fragment } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import styles from "../src/js/styles.module.css";
import { StepsPages } from "./StepsPages";
import classNames from "classnames";
import { FirstPage } from "./FirstPage";
import { LastPage } from "./LastPage";
import { OnboardingMessages } from "../src/js/messages";
import autoAnimate from '@formkit/auto-animate'

// TODO probably should allow filtering steps by platform

/**
 * @param {{messaging: OnboardingMessages}} props 
 */
export function App({messaging}) {
  const isMobile = window.innerWidth <= 480

  const stepsPagesMobile = [
    {
      title: "A better Internet starts with\u00A0privacy",
      bordered: true,
      steps: [
        {
          id: "private-search",
          title: "Private Search",
          icon: "Search",
          detail: "We don't track you. Ever.",
          primaryLabel: "Got it!",
          primaryFn: () => true,
        },
        {
          id: "tracking-protection",
          title: "Tracking Protection",
          icon: "Shield",
          detail: "We block most trackers before they even load.",
          primaryLabel: "OK",
          primaryFn: () => true,
        },
        {
          id: "cookie-popups",
          title: "Block Cookie Pop-ups",
          icon: "Cookie-Popups",
          detail: "We say no to cookies on your behalf, while hiding blocking annoying cookie consent pop-ups.",
          primaryLabel: "Leave On",
          primaryFn: () => {
            messaging.setBlockCookiePopups(true)
            return true
          },
          secondaryLabel: "Turn Off",
          secondaryFn: () => {
            messaging.setBlockCookiePopups(false)
            return false
          }
        }
      ],
    },
    {
      title: "Browse how you\u00A0like",
      detail:
        "Make DuckDuckGo work just the way you\u00A0want.",
      steps: [
        // TODO
        {
          id: "address-bar",
          title: "Address Bar",
          icon: "Session-Restore",
          detail: "Show the address bar on the top or bottom of your screen.",
          primaryLabel: "Top",
          primaryFn: () => {
            return true
          },
          secondaryLabel: "Bottom",
          secondaryFn: () => {
            return false
          }
        },
      ],
    },
    {
      title: "Make privacy your\u00A0go-to",
      steps: [
        {
          id: "default-browser",
          title: "Switch your default browser",
          icon: "Set-Default",
          detail: "Always browse privately by default.",
          primaryLabel: 'Make Default Browser',
          primaryFn: async () => await messaging.requestSetAsDefault(),
          secondaryLabel: "Skip",
          secondaryFn: () => false
        },
      ],
    },
];
    const stepsPagesDesktop = [
        {
          title: "A better Internet starts with\u00A0privacy",
          bordered: true,
          steps: [
            {
              id: "private-search",
              title: "Private Search",
              icon: "Search",
              detail: "We don't track you. Ever.",
              primaryLabel: "Got it!",
              primaryFn: () => true,
            },
            {
              id: "tracking-protection",
              title: "Tracking Protection",
              icon: "Shield",
              detail: "We block most trackers before they even load.",
              primaryLabel: "OK",
              primaryFn: () => true,
            },
            {
              id: "cookie-popups",
              title: "Block Cookie Pop-ups",
              icon: "Cookie-Popups",
              detail: "Want us to say no to cookies on your behalf?",
              primaryLabel: "Block Cookie Pop-ups",
              primaryFn: () => {
                messaging.setBlockCookiePopups(true)
                return true
              },
              secondaryLabel: "Skip",
              secondaryFn: () => {
                messaging.setBlockCookiePopups(false)
                return false
              }
            },
            {
              id: "duck-player",
              title: "Open YouTube videos in Duck Player",
              icon: "DuckPlayer",
              detail: "Enforce YouTube’s strictest privacy settings by default.",
              primaryLabel: "Enable Duck Player",
              primaryFn: () => {
                messaging.setDuckPlayer(true)
                return true
              },
              secondaryLabel: "Skip",
              secondaryFn: () => {
                messaging.setDuckPlayer(false)
                return false
              }
            }
          ],
        },
        {
          title: "Browse how you\u00A0like",
          detail:
            "Make DuckDuckGo work just the way you\u00A0want.",
          steps: [
            {
              id: "bookmarks-bar",
              title: "Quick access to your bookmarks",
              icon: "Bookmarks-Bar",
              detail: "Show a bookmarks bar with your favorite bookmarks.",
              primaryLabel: "Show Bookmarks Bar",
              primaryFn: () => {
                messaging.setBookmarksBar(true)
                return true
              },
              secondaryLabel: "Skip",
              secondaryFn: () => {
                messaging.setBookmarksBar(false)
                return false
              }
            },
            {
              id: "session-restore",
              title: "Pick up where you left off",
              icon: "Session-Restore",
              detail: "Always restart with your last open windows and tabs.",
              primaryLabel: 'Enable Session Restore',
              primaryFn: () => {
                messaging.setSessionRestore(true)
                return true
              },
              secondaryLabel: "Skip",
              secondaryFn: () => {
                messaging.setSessionRestore(false)
                return false
              }
            },
            {
              id: "home-button",
              title: "Add a shortcut to your homepage",
              icon: "Home",
              detail: "Show a home button in your toolbar.",
              primaryLabel: 'Show Home Button',
              primaryFn: () => {
                messaging.setShowHomeButton(true)
                return true
              },
              secondaryLabel: "Skip",
              secondaryFn: () => {
                messaging.setShowHomeButton(false)
                return false
              }
            },
          ],
        },
        {
          title: "Make privacy your\u00A0go-to",
          steps: [
            {
              id: "keep-in-dock",
              title: "Keep DuckDuckGo in your Dock",
              icon: "Dock",
              detail: "Get to the browser faster.",
              primaryLabel: "Keep in Dock",
              primaryFn: () => true,
              secondaryLabel: "Remove",
              secondaryFn: () => {
                messaging.requestRemoveFromDock()
                return false
              }
            },
            {
              id: "import",
              title: "Bring your stuff",
              icon: "Bring-Stuff",
              detail: "Import bookmarks, favorites, and passwords.",
              primaryLabel: 'Import',
              primaryFn: async () => await messaging.requestImport(),
              secondaryLabel: "Skip",
              secondaryFn: () => false
            },
            {
              id: "default-browser",
              title: "Switch your default browser",
              icon: "Set-Default",
              detail: "Always browse privately by default.",
              primaryLabel: 'Make Default',
              primaryFn: async () => await messaging.requestSetAsDefault(),
              secondaryLabel: "Skip",
              secondaryFn: () => false
            },
          ],
        },
    ];

    const stepsPages = isMobile ? stepsPagesMobile : stepsPagesDesktop
      

  // TODO revert to 0
  const [pageIndex, setPageIndex] = useState(0);
  const [stepResults, setStepResults] = useState({});

  const pageParent = useRef(null)

  useEffect(() => {
    pageParent.current && autoAnimate(pageParent.current)
  }, [pageParent])

  return (
    <>
    <main className={styles.container} ref={pageParent}>
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
          onSettings={() => messaging.dismissToSettings()}
          stepsPages={stepsPages}
          stepResults={stepResults}
        />
      )}
    </main>

    <div className={classNames(styles.foreground, styles.layer1)} />
      <div className={classNames(styles.foreground, styles.layer2)} />
      <div className={classNames(styles.foreground, styles.layer3)} />
    </>
  );
}
