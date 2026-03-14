#!/bin/bash
set -e

HEAD_SHA="75571d7a40f1eadae7af91119d3cff8559c3ec8b"
SUFFIX="392b"

# Dependency map: file -> extra files to include
declare -A DEPS
DEPS["injected/src/features/autofill-import.js"]="injected/src/globals.d.ts"
DEPS["injected/src/features/broker-protection/extractors/address.js"]="injected/src/features/broker-protection/extractors/parse-address.d.ts"
DEPS["injected/src/features/broker-protection/captcha-services/captcha.service.js"]="injected/src/features/broker-protection/types.js"
DEPS["injected/src/features/broker-protection/actions/fill-form.js"]="injected/src/features/broker-protection/comparisons/address.js"

# Generate short branch name from file path
get_branch_name() {
    local f="$1"
    # Strip prefix and extension
    local name="${f#injected/src/}"
    name="${name%.js}"
    name="${name%.ts}"
    name="${name%.d}"
    # Replace / with -
    name="${name//\//-}"
    echo "cursor/strict-type/${name}-${SUFFIX}"
}

# Read file list
FILES=(
    "injected/src/detectors/detections/adwall-detection.js"
    "injected/src/detectors/detections/bot-detection.js"
    "injected/src/detectors/detections/youtube-ad-detection.js"
    "injected/src/detectors/utils/detection-utils.js"
    "injected/src/features/api-manipulation.js"
    "injected/src/features/autofill-import.js"
    "injected/src/features/breakage-reporting.js"
    "injected/src/features/breakage-reporting/utils.js"
    "injected/src/features/broker-protection.js"
    "injected/src/features/broker-protection/actions/build-url.js"
    "injected/src/features/broker-protection/actions/build-url-transforms.js"
    "injected/src/features/broker-protection/actions/captcha-callback.js"
    "injected/src/features/broker-protection/actions/captcha-deprecated.js"
    "injected/src/features/broker-protection/actions/click.js"
    "injected/src/features/broker-protection/actions/extract.js"
    "injected/src/features/broker-protection/actions/fill-form.js"
    "injected/src/features/broker-protection/captcha-services/captcha.service.js"
    "injected/src/features/broker-protection/captcha-services/providers/cloudflare-turnstile.js"
    "injected/src/features/broker-protection/comparisons/address.js"
    "injected/src/features/broker-protection/comparisons/is-same-age.js"
    "injected/src/features/broker-protection/execute.js"
    "injected/src/features/broker-protection/extractors/address.js"
    "injected/src/features/broker-protection/extractors/parse-address.d.ts"
    "injected/src/features/broker-protection/types.js"
    "injected/src/features/broker-protection/utils/utils.js"
    "injected/src/features/click-to-load.js"
    "injected/src/features/click-to-load/components/ctl-login-button.js"
    "injected/src/features/cookie.js"
    "injected/src/features/duck-ai-chat-history.js"
    "injected/src/features/duck-ai-data-clearing.js"
    "injected/src/features/duck-player.js"
    "injected/src/features/duck-player-native.js"
    "injected/src/features/duckplayer/components/ddg-video-drawer-mobile.js"
    "injected/src/features/duckplayer/components/ddg-video-overlay.js"
    "injected/src/features/duckplayer/environment.js"
    "injected/src/features/duckplayer/icon-overlay.js"
    "injected/src/features/duckplayer/overlay-messages.js"
    "injected/src/features/duckplayer/thumbnails.js"
    "injected/src/features/duckplayer/util.js"
    "injected/src/features/duckplayer/video-overlay.js"
    "injected/src/features/duckplayer-native/custom-error/custom-error.js"
    "injected/src/features/duckplayer-native/messages.js"
    "injected/src/features/duckplayer-native/overlays/thumbnail-overlay.js"
    "injected/src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js"
    "injected/src/features/duckplayer-native/sub-features/duck-player-native-youtube.js"
    "injected/src/features/duckplayer-native/youtube-errors.js"
    "injected/src/features/element-hiding.js"
    "injected/src/features/exception-handler.js"
    "injected/src/features/favicon.js"
    "injected/src/features/fingerprinting-audio.js"
    "injected/src/features/fingerprinting-canvas.js"
    "injected/src/features/fingerprinting-screen-size.js"
    "injected/src/features/fingerprinting-temporary-storage.js"
    "injected/src/features/gpc.js"
    "injected/src/features/harmful-apis.js"
    "injected/src/features/message-bridge.js"
    "injected/src/features/message-bridge/create-page-world-bridge.js"
    "injected/src/features/message-bridge/schema.js"
    "injected/src/features/navigator-interface.js"
    "injected/src/features/page-context.js"
    "injected/src/features/performance-metrics.js"
    "injected/src/features/ua-ch-brands.js"
    "injected/src/features/web-compat.js"
    "injected/src/features/web-detection/parse.js"
    "injected/src/features/web-interference-detection.js"
    "injected/src/features/web-telemetry.js"
    "injected/src/features/windows-permission-usage.js"
    "injected/src/globals.d.ts"
    "injected/src/navigator-global.js"
    "injected/src/features/duckplayer-native/pause-video.js"
    "injected/src/features/broker-protection/comparisons/is-same-name.js"
)

TOTAL=${#FILES[@]}
COUNT=0
ERRORS=()

for f in "${FILES[@]}"; do
    COUNT=$((COUNT + 1))
    BRANCH=$(get_branch_name "$f")
    SHORT=$(basename "$f")
    
    echo "[$COUNT/$TOTAL] $SHORT -> $BRANCH"
    
    # Switch to main
    git checkout main --quiet 2>/dev/null
    
    # Create branch
    git checkout -b "$BRANCH" --quiet 2>/dev/null
    
    # Checkout file from completed branch
    git checkout "$HEAD_SHA" -- "$f" 2>/dev/null
    
    # Add dependency files if any
    DEP="${DEPS[$f]}"
    if [ -n "$DEP" ]; then
        git checkout "$HEAD_SHA" -- "$DEP" 2>/dev/null
        echo "  + dep: $DEP"
    fi
    
    # Commit
    git add -A
    git commit -m "strict-type: $(basename "$f")" --quiet 2>/dev/null
    
    # Push
    if git push -u origin "$BRANCH" --quiet 2>/dev/null; then
        echo "  ✅ pushed"
    else
        echo "  ❌ push failed"
        ERRORS+=("$f")
    fi
    
    # Cleanup - back to detached
    git checkout main --quiet 2>/dev/null
    git branch -D "$BRANCH" --quiet 2>/dev/null
done

# Return to working branch
git checkout jkt/auto/injected-code-strict-typing-392b --quiet 2>/dev/null

echo ""
echo "Done: $COUNT branches created"
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "Errors:"
    for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi
