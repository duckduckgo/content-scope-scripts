#!/usr/bin/env bash
set -euo pipefail

# Produce the changelog for the release currently being built: every commit on
# `main` that was NOT part of the previous release.
#
# We anchor on commit *ancestry*, not on dates. Release tags point at build
# commits on the `releases` branch, whose timestamps are set at build time and
# therefore drift *later* than the `main` commits they package. Combined with
# merge-queue commits (whose committer date can predate when they land on
# `main`), a date-based `--since` boundary silently drops legitimately
# unreleased commits. Anchoring on the `main` commit that was last released
# avoids this entirely.
#
# The anchor is a lightweight `released/<version>` tag placed on the released
# `main` commit by the release workflow (see .github/workflows/build.yml).

PREV_MAIN_ANCHOR=$(git tag -l 'released/*' | sort -V | tail -1)

if [ -n "$PREV_MAIN_ANCHOR" ]; then
    git log "${PREV_MAIN_ANCHOR}..main" --pretty='format:- %s'
else
    # Fallback for the first anchored release (no `released/*` tag exists yet).
    # Uses the commit date of the newest release tag. NOTE: this is the legacy
    # behaviour and can drop commits whose committer date precedes the release
    # build commit; it is only a bootstrap path until the first anchor exists.
    LAST_RELEASE_COMMIT=$(git rev-list --tags --max-count=1)
    git log main --since "$(git show -s --format=%ci "$LAST_RELEASE_COMMIT")" --pretty='format:- %s'
fi
