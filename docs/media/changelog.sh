#!/usr/bin/env bash
set -euo pipefail

# Changelog for the release being built: commits on `main` since the previous
# release. Anchored by ancestry, not dates — release tags live on the
# `releases` branch with build-time timestamps that drift later than the `main`
# commits they package, so a date-based `--since` drops merge-queue commits.
#
# The anchor is a lightweight `released/<version>` tag on the released `main`
# commit, pushed by the release workflow (see .github/workflows/build.yml).

# Latest semver release; `|| true` avoids a pipefail abort when grep matches
# nothing (LATEST_RELEASE stays empty and we use the date-based fallback).
LATEST_RELEASE=$(git tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1 || true)

# Require the anchor paired with the *latest* release, not just the highest
# `released/*` tag — otherwise a release missing its anchor would replay
# already-shipped commits from an older one.
if [ -n "$LATEST_RELEASE" ] && git rev-parse -q --verify "refs/tags/released/${LATEST_RELEASE}" >/dev/null; then
    git log "released/${LATEST_RELEASE}..main" --pretty='format:- %s'
else
    # No paired anchor (bootstrap, or missing pairing): fall back to the newest
    # release tag's commit date. Less precise, but tied to the latest release.
    if [ -n "$LATEST_RELEASE" ]; then
        echo "changelog.sh: no 'released/${LATEST_RELEASE}' anchor found; using date-based fallback" >&2
    fi
    LAST_RELEASE_COMMIT=$(git rev-list --tags --max-count=1)
    git log main --since "$(git show -s --format=%ci "$LAST_RELEASE_COMMIT")" --pretty='format:- %s'
fi
