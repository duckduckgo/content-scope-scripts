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

### Creating a release

1. Go to [Actions → Release](https://github.com/duckduckgo/content-scope-scripts/actions/workflows/build.yml)
2. Click "Run workflow"
3. Select version bump type
4. Click "Run workflow"

The workflow creates a tag and GitHub release automatically. Build artifacts on the `releases` branch are consumed by native app repos.

### Breaking Changes Protocol

**When making breaking changes:**

1. Ensure you land a **major release** version bump.
2. **Test and complete the native application side first** before merging the C-S-S repo change.
3. Only merge the C-S-S change after native app support is complete.

**Why This Matters**

This prevents any engineer from having a breaking change and broken workflow. The native application must be tested and complete before the C-S-S repo change is merged.
