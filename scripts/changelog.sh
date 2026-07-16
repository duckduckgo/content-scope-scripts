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
#
# The boundary MUST be the anchor paired with the *latest* semver release, not
# merely the highest `released/*` tag that happens to exist. If a release tag
# were shipped without its paired anchor, picking the highest existing anchor
# would start the range from an older release and repeat already-shipped
# commits. So we resolve the latest release version first, then require its
# matching anchor; if it is absent we fall back to the (less precise)
# date-based boundary rather than trust a mismatched older anchor.

# Latest semver release tag (same selection as the release workflow).
LATEST_RELEASE=$(git tag -l | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)

if [ -n "$LATEST_RELEASE" ] && git rev-parse -q --verify "refs/tags/released/${LATEST_RELEASE}" >/dev/null; then
    git log "released/${LATEST_RELEASE}..main" --pretty='format:- %s'
else
    # No anchor paired with the latest release (bootstrap before anchors
    # existed, or a missing pairing). Fall back to the commit date of the
    # newest release tag. This is anchored to the correct (latest) release, so
    # it will not replay commits from an older release; it can still drop
    # commits whose committer date precedes the release build commit.
    if [ -n "$LATEST_RELEASE" ]; then
        echo "changelog.sh: no 'released/${LATEST_RELEASE}' anchor found; using date-based fallback" >&2
    fi
    LAST_RELEASE_COMMIT=$(git rev-list --tags --max-count=1)
    git log main --since "$(git show -s --format=%ci "$LAST_RELEASE_COMMIT")" --pretty='format:- %s'
fi
