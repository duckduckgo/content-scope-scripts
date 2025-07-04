# Platform Integration Guide

## Overview

The [injected/entry-points/](https://github.com/duckduckgo/content-scope-scripts/tree/main/injected/entry-points) directory handles platform specific differences and is glue code into calling the contentScopeFeatures API.

## Platform-Specific Implementation Details

### Firefox
The code is loaded as a standard extension content script.

### Apple, Windows, and Android
The code is a UserScript that has some string replacements for properties and loads in as the page scope.

> **Note**: Currently we don't implement the update calls as it's only required by cookie protections which we don't implement.

### All Other Browsers
The code is stringified, base64 encoded and injected in as a self deleting `<script>` tag.

In the built output you will see these dramatic differences in the bundled code which is created into: `/build`

## App-Specific Integration Replacements

The following placeholders are replaced during the build process:

- **`$CONTENT_SCOPE$`** - Raw remote config object
- **`$USER_UNPROTECTED_DOMAINS$`** - An array of user allowlisted domains
- **`$USER_PREFERENCES$`** - An object containing:
  - `platform`: `{ name: '<ios | macos | extension | android>' }`
  - `debug`: boolean
  - `globalPrivacyControlValue`: boolean
  - `sessionKey`: `<CSRNG UUID 4 string>` (used for fingerprinting) - this should regenerate on browser close or every 24 hours 