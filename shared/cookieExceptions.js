
/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable eol-last */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-multiple-empty-lines */
    export const exceptions = [
  {
    "domain": "nespresso.com",
    "reason": "Clicking 'Continue' after filling out details for account creation yields an error."
  }
]
    export const excludedCookieDomains = [
  {
    "domain": "accounts.google.com",
    "reason": "On some Google sign-in flows, there is an error after entering username and proceeding: 'Your browser has cookies disabled. Make sure that your cookies are enabled and try again.'"
  },
  {
    "domain": "pay.google.com",
    "reason": "After sign-in for Google Pay flows, there is repeated flickering and a loading spinner, preventing the flow from proceeding."
  },
  {
    "domain": "payments.google.com",
    "reason": "After sign-in for Google Pay flows (after flickering is resolved), blocking this causes the loading spinner to spin indefinitely, and the payment flow cannot proceed."
  },
  {
    "domain": "shutterfly.com",
    "reason": "https://github.com/duckduckgo/privacy-configuration/issues/544"
  }
]
    