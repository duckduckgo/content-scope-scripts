# Testing Guide

## Overview

Depending on what you are changing, you may need to run the build processes locally, or individual tests. The following all run within GitHub Actions when you create a pull request, but you can run them locally as well.

## Quick Test Command

If you want to get a good feeling for whether a PR or CI run will pass/fail, you can run the `test` command which chains most of the following together:

```shell
# run this if you want some confidence that your PR will pass
npm test
```

## Individual Test Commands

### ESLint

See root-level package for lint commands

### TypeScript

See root-level package for TypeScript commands

### Unit Tests (Jasmine)

Everything for unit-testing is located in the `unit-test` folder. Jasmine configuration is in `unit-test/jasmine.json`.

```shell
npm run test-unit
```

### Feature Integration Tests (Playwright)

Everything within `integration-test` is integration tests controlled by Playwright.

```shell
npm run test-int
```

**Important**: When writing integration tests, follow the [testing best practices](../docs/test-pages-guide.md#testing-best-practices) outlined in the Test Pages Guide. These guidelines cover avoiding custom state in spec files, using platform configuration, and preferring config-driven testing approaches.

**Preferred Testing Approach**: The [Test Pages Guide](../docs/test-pages-guide.md) describes the most preferred type of testing for the `/injected` directory. Test pages are the preferred approach where possible because they are **sharable with platforms** - the same test pages can be used by Android, Apple, Windows, and browser extension teams, ensuring consistent functionality validation across all platforms.

### Feature Build Process

To produce all artefacts that are used by platforms, just run the `npm run build` command. This will create platform specific code within the `build` folder (that is not checked in).

```shell
npm run build
```
