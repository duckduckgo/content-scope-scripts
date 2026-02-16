# Contributing

## Workspace-specific guides

- [Injected coding guidelines](./injected/docs/coding-guidelines.md)
- [Injected testing guide](./injected/docs/testing-guide.md)
- [Special Pages README](./special-pages/README.md)
- [Messaging docs](./messaging/docs/messaging.md)

## Development

Consider using [nvm](https://github.com/nvm-sh/nvm) to manage node versions, after installing in the project directory run:

```
nvm use
```

From the top-level root folder of this npm workspace, you can run the following npm commands:

**Install dependencies**:

Will install all the dependencies we need to build and run the project:
```
npm install
```

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

**Run integration tests for all workspaces**:
```sh
npm run test-int
```

**Run extended integration tests for all workspaces**:
```sh
npm run test-int-x
```

**Clean tree and check for changes**:
```sh
npm run test-clean-tree
```

**Generate documentation using TypeDoc**:
```sh
npm run docs
```

**Generate and watch documentation using TypeDoc**:
```sh
npm run docs-watch
```

**Compile TypeScript files**:
```sh
npm run tsc
```

**Watch and compile TypeScript files**:
```sh
npm run tsc-watch
```

**Lint the codebase using ESLint**:
```sh
npm run lint
```

**Lint and automatically fix issues**:
```sh
npm run lint-fix
```

**Serve integration test pages on port 3220**:
```sh
npm run serve
```

**Serve special pages on port 3221**:
```sh
npm run serve-special-pages
```

## Release Process

Releases are created via GitHub Actions: [Release workflow](https://github.com/duckduckgo/content-scope-scripts/actions/workflows/build.yml)

### Why release branches exist

C-S-S is consumed by native apps (Android, iOS, macOS, Windows) that each use a different dependency mechanism (npm, Swift Package Manager, git submodules). These consumers need **built artifacts** (`build/`, `Sources/ContentScopeScripts/dist/`) — not source code they'd have to compile themselves.

On `main` and feature branches, `build/` and `Sources/ContentScopeScripts/dist/*.js` are **gitignored**. This keeps diffs clean: PRs show only source changes, not thousands of lines of generated JavaScript.

Built artifacts live on dedicated branches:

| Branch | Purpose | How it's created |
|--------|---------|-----------------|
| `releases` | Production releases. Tags (e.g. `12.38.0`) point here. | Manual `workflow_dispatch` on `build.yml` |
| `pr-releases/<branch>` | Per-PR build artifacts for cross-repo testing. | Automatic via `build-pr.yml` on every PR push |

The `releases` branch is the long-lived equivalent of "what `main` would look like if we checked in build output". The `pr-releases/` branches are ephemeral — created when a PR is opened/updated, deleted when it's closed.

**Why not check build output into `main` directly?**

- Rebasing becomes painful: every commit in a rebase would require rebuilding and re-staging `build/` and `Sources/`.
- PRs become unreadable: generated diffs dwarf the actual source changes.
- Merge conflicts in generated files are meaningless noise.

The separate-branch approach was adopted via [Tech Design: Build automation for content-scope-scripts](https://app.asana.com/0/1201614831475344/1203979567756832/f).

### Creating a release

1. Go to [Actions → Release](https://github.com/duckduckgo/content-scope-scripts/actions/workflows/build.yml)
2. Click "Run workflow"
3. Select version bump type
4. Click "Run workflow"

The workflow creates a tag and GitHub release automatically. Build artifacts on the `releases` branch are consumed by native app repos.

### PR build branches

When you push to any branch (except `main`, `releases`, or `pr-releases/*`), the `build-pr.yml` workflow automatically:

1. Builds all workspaces (`npm run build`)
2. Pushes the source + build artifacts to `pr-releases/<your-branch-name>`
3. If an open PR exists for the branch, updates the PR description and posts a comment with:
   - Integration commands for each platform
   - Commit-pinned docs preview URL
   - Static special-pages preview URL pattern (commit-pinned)

The build branch is created on the first push and updated on every subsequent push. It's deleted automatically when the source branch is deleted.

**Using a PR build branch in a native client:**

```sh
# Android / Extension (npm)
npm i github:duckduckgo/content-scope-scripts#pr-releases/my-feature-branch

# Apple (Swift Package Manager) — in Package.swift
.package(url: "https://github.com/duckduckgo/content-scope-scripts.git",
         branch: "pr-releases/my-feature-branch")

# Windows (git submodule)
git -C submodules/content-scope-scripts fetch origin pr-releases/my-feature-branch
git -C submodules/content-scope-scripts checkout origin/pr-releases/my-feature-branch
```

**Preview docs from that build commit:**

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/docs/index.html
```

Special-pages index inside docs:

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/docs/build/pages/index.html
```

New Tab demo and docs links:

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/build/integration/pages/new-tab/index.html
```

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/docs/build/pages/new-tab/index.html
```

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/docs/documents/New_Tab_Page.html
```

**Preview injected integration test pages from that build commit:**

```text
https://github.com/duckduckgo/content-scope-scripts/blob/<build-commit-hash>/injected/integration-test/test-pages/index.html
```

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/injected/integration-test/test-pages/index.html
```

Example:

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/injected/integration-test/test-pages/webcompat/index.html
```

**Preview special pages from that build commit:**

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/build/integration/pages/index.html
```

That index page links to all built special pages. Individual pages are also available at:

```text
https://rawcdn.githack.com/duckduckgo/content-scope-scripts/<build-commit-hash>/build/integration/pages/<page>/index.html
```

### Breaking Changes Protocol

**When making breaking changes:**

1. Ensure you land a **major release** version bump.
2. **Test and complete the native application side first** before merging the C-S-S repo change.
3. Only merge the C-S-S change after native app support is complete.

**Why This Matters**

This prevents any engineer from having a breaking change and broken workflow. The native application must be tested and complete before the C-S-S repo change is merged.
