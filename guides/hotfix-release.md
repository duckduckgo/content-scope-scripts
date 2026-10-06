# Hotfix Releases

Use this when a released version needs a fix **now** and you cannot wait for the next `main` release.

Normal releases are automated ([Release workflow](https://github.com/duckduckgo/content-scope-scripts/actions/workflows/build.yml)): they copy `main` onto the `releases` branch, build, commit the artifacts and tag. A hotfix does the same thing by hand, starting from an existing release tag instead of `main`. Because built code is checked in, the process is a little laborious.

Background on why build output lives on a separate branch: [CONTRIBUTING.md → Why release branches exist](../CONTRIBUTING.md#why-release-branches-exist).

## Before you start

- **The fix must already be merged to `main`.** You cherry-pick from `main` onto the hotfix branch. If the commit only exists on the hotfix branch, the next regular release silently reverts it.
- **Nothing to bump in the repo.** The root `package.json` has no `version` field; the version is the git tag and nothing else.
- **The patch digit is yours.** `build.yml` always emits `${MAJOR}.${MINOR}.0` and ignores the patch component when computing the next version, so `x.y.1`, `x.y.2` … can never collide with an automated release, and a hotfix tag does not skew the next minor. Apple consumers need this: Swift Package Manager only accepts a strict `major.minor.patch` trio, so the patch slot is the only room a hotfix has.

> [!WARNING]
> Because only `major.minor.patch` is available to Apple codebases, keep reserving the patch digit in automated releases. If `build.yml` ever starts emitting a non-zero patch, hotfix numbering collides.

## 1. Create and build the hotfix branch

Work in a **clean clone or worktree** — step 4 force-adds files, and stray local output (`coverage/`, `test-results/`, `docs/`, `.env`) would be swept in.

1. **Fetch tags and check out the release you are fixing.** Tags are not present in a shallow clone.

    ```sh
    git fetch --tags origin
    git checkout 4.21.1          # {release-tag}
    git checkout -b hotfix/4.21.2 # hotfix/{release-tag+1}
    ```

2. **Cherry-pick the fix from `main`.** Source files on `releases` are a straight copy of `main`, so commits that only touch source apply cleanly.

    ```sh
    git cherry-pick <commit-sha>
    ```

3. **Build exactly what CI would build.**

    ```sh
    nvm use
    npm ci        # not `npm install` — ci installs the lockfile exactly, as build.yml does
    npm run build
    ```

4. **Check in the build output and commit.** The release workflow adds everything, so mirror it rather than listing directories:

    ```sh
    git add -f . ':!node_modules' ':!CHANGELOG.txt'
    git status --short   # eyeball this before committing
    git commit -m "Hotfix release of 4.21.2 based on 4.21.1"
    git push -u origin hotfix/4.21.2
    ```

    > [!NOTE]
    > `git add -f build/ Sources/` is **not** enough. `npm run build` also regenerates `injected/src/features/tracker-protection/surrogates-generated.js` and its `.d.ts` (via the `prebuild` → `build-surrogates` step). Those are gitignored in source but tracked on `releases`, so a narrow add leaves them stale and the branch no longer matches its own source.

## 2. Verify the branch before tagging

1. **Rebuild and assert the tree is clean.** This proves the checked-in artifacts match the checked-in source:

    ```sh
    npm run test-clean-tree
    ```

2. **Compare against the base tag on GitHub** and confirm only the expected changes are present, source and compiled:

    ```text
    https://github.com/duckduckgo/content-scope-scripts/compare/4.21.1...hotfix/4.21.2
    ```

    > [!NOTE]
    > `test-clean-tree` only inspects tracked files. A build that produces a **new** file (a new locale, a new bundle) is ignored-and-untracked, so it will not fail the check — the GitHub compare is what catches it.

The hotfix branch can be tested in isolation from here (see [CONTRIBUTING.md → Using a PR build branch in a native client](../CONTRIBUTING.md#pr-build-branches) for the per-platform reference syntax), but applications should end up pointing at the released tag, not the branch.

## 3. Create the release and tag

1. Open <https://github.com/duckduckgo/content-scope-scripts/releases/new>
2. Change **Target** to `hotfix/{release-tag+1}`
3. In **Choose tag** type `{release-tag+1}` and select **Create new tag on publish**
4. In the notes, list the commits that were added and link to them
5. **Untick "Set as the latest release"**, unless this genuinely is the latest
6. Publish

> [!WARNING]
> Getting the "latest" flag wrong has real consequences. Anything reading the GitHub `releases/latest` endpoint — Android automation among them — will pick up the hotfix number and present it as the current release in PRs and documentation, even though it is an older line.

> [!NOTE]
> Automated releases are marked latest by default (`softprops/action-gh-release`), which is why this is an explicit manual step here.

## 4. Preserve the branch and re-verify

- **Keep `hotfix/{release-tag+1}` around.** The tag is what actually pins the commits, so publishing the release first is the step that protects them — but do not delete the branch before the tag exists, and keeping it afterwards matches existing practice (`hotfix/4.21.2`, `hotfix/4.22.5` and `hotfix/12.4.1` are all still present) and makes a follow-up hotfix on the same line straightforward.
- **Compare the two tags** and confirm, again, that only the expected source and compiled changes are there:

    ```text
    https://github.com/duckduckgo/content-scope-scripts/compare/4.21.1...4.21.2
    ```

## 5. Restore the changelog anchor

**Do not skip this.** It is the one step with no manual equivalent in the release UI, and skipping it corrupts the *next* regular release's notes.

[`scripts/changelog.sh`](../scripts/changelog.sh) finds the highest semver tag and looks for a matching `released/<version>` anchor on `main`. A hotfix tag is now the highest semver tag and has no anchor, so the script falls back to a date-based boundary — the newest tagged commit, which is the hotfix build — and the next release's changelog drops every `main` commit between the base release and the hotfix. If nothing landed on `main` after the hotfix, the changelog comes out empty and `build.yml` aborts the release.

Point the new anchor at the same `main` commit as the base release's anchor. The hotfix did not advance `main`'s release frontier, so the range is unchanged:

```sh
git tag released/4.21.2 "$(git rev-parse released/4.21.1)"
git push origin released/4.21.2
```

If the base release predates the anchor system (anchors start at `released/15.14.0`), anchor to the `main` commit that release was built from instead.

## Checklist

- [ ] Fix is merged to `main`
- [ ] Built with `npm ci` + `npm run build` in a clean checkout
- [ ] All generated files added, including `surrogates-generated.js` / `.d.ts`
- [ ] `npm run test-clean-tree` passes and the GitHub compare shows only expected changes
- [ ] Release published with "Set as the latest release" unticked (unless it is)
- [ ] `released/{release-tag+1}` anchor pushed
