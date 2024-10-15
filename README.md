# Project Overview

This repository uses npm workspaces to manage multiple projects within a single codebase. Some scripts, such as those
for ESLint, TypeScript, and documentation generation, are global in nature (see below).

Please check the README.md & package.json in each

## Child Projects

### [1. Injected](./injected)

This is a framework designed to create specialized JavaScript bundles tailored to specific sets of
protections and features for different platforms. For instance, Apple platforms might utilize
a particular combination of features, while Android may require a different configuration entirely.

Features here have a deep integration with [privacy-configuration](https://github.com/duckduckgo/privacy-configuration),
to allow dynamic enabling or disabling of features at runtime.

### [2. Special Pages](./special-pages)

This project contains a set of isolated JavaScript applications that end up being embedded directly into
our browsers. A 'special page' can be as simple as a single-screen, or as complex as a New Tab Page.

Special Pages are often developed for a specific platform initially, but can then be easily adopted
by others when it makes sense.

### [3. Messaging](./messaging)

This project serves as an abstraction layer for seamless web-to-native and native-to-web
communications, inspired by the [JSON-RPC](https://www.jsonrpc.org/specification) format.
Its primary goal is to simplify the development process by allowing engineers to focus on building
features without worrying about the underlying communication mechanisms.

The module provides three core methods: `notify` for fire-and-forget messages, `request` for asynchronous request-response
interactions, and `subscribe` for handling push-based data updates.

---

## NPM commands

From the top-level root folder of this npm workspace, you can run the following npm commands:

**Build all workspaces**:

Use this to produce the same output as a release. The `build` directory will be populated with
various artifacts.

  ```sh
  npm run build
  ```

> [!TIP]
> You can run the `build` command from within any sub-project too, the artifacts will always be
> lifted out to the root-level `build` folder.

**Run unit tests for all workspaces**:
  ```sh
  npm run test-unit
  ```

- **Run integration tests for all workspaces**:
  ```sh
  npm run test-int
  ```

- **Run extended integration tests for all workspaces**:
  ```sh
  npm run test-int-x
  ```

- **Build TypeScript types**:
  ```sh
  npm run build-types
  ```

- **Clean tree and check for changes**:
  ```sh
  npm run test-clean-tree
  ```

- **Generate documentation using TypeDoc**:
  ```sh
  npm run docs
  ```

- **Generate and watch documentation using TypeDoc**:
  ```sh
  npm run docs-watch
  ```

- **Compile TypeScript files**:
  ```sh
  npm run tsc
  ```

- **Watch and compile TypeScript files**:
  ```sh
  npm run tsc-watch
  ```

- **Lint the codebase using ESLint**:
  ```sh
  npm run lint
  ```

- **Lint without outputting globals**:
  ```sh
  npm run lint-no-output-globals
  ```

- **Lint and automatically fix issues**:
  ```sh
  npm run lint-fix
  ```

- **Serve integration test pages on port 3220**:
  ```sh
  npm run serve
  ```

- **Serve special pages on port 3221**:
  ```sh
  npm run serve-special-pages
  ```
