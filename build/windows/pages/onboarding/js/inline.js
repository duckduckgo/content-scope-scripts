"use strict";
(() => {
  // pages/onboarding/src/js/inline.js
  var param = new URLSearchParams(window.location.search).get("platform") || "windows";
  if (isAllowed(param)) {
    document.documentElement.dataset.platform = String(param);
  }
  function isAllowed(input) {
    const allowed = ["windows", "apple", "integration"];
    return allowed.includes(input);
  }
})();
