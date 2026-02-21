#!/usr/bin/env node
/**
 * Checks that injected core source files pass TypeScript strict mode.
 *
 * Runs tsc with tsconfig.strict-core.json and filters output to only core files.
 * Feature files are checked transitively but their errors are not reported here.
 */
import { execSync } from 'node:child_process';

const CORE_FILES = new Set([
    'injected/src/canvas.js',
    'injected/src/captured-globals.js',
    'injected/src/config-feature.js',
    'injected/src/content-feature.js',
    'injected/src/content-scope-features.js',
    'injected/src/cookie.js',
    'injected/src/crypto.js',
    'injected/src/dom-utils.js',
    'injected/src/features.js',
    'injected/src/performance.js',
    'injected/src/sendmessage-transport.js',
    'injected/src/timer-utils.js',
    'injected/src/trackers.js',
    'injected/src/type-utils.js',
    'injected/src/url-change.js',
    'injected/src/utils.js',
    'injected/src/wrapper-utils.js',
    // Feature files
    'injected/src/features/api-manipulation.js',
    'injected/src/features/autofill-import.js',
    'injected/src/features/breakage-reporting.js',
    'injected/src/features/breakage-reporting/utils.js',
    'injected/src/features/broker-protection.js',
    'injected/src/features/broker-protection/actions/actions.js',
    'injected/src/features/broker-protection/actions/build-url.js',
    'injected/src/features/broker-protection/actions/build-url-transforms.js',
    'injected/src/features/broker-protection/actions/captcha-callback.js',
    'injected/src/features/broker-protection/actions/captcha-deprecated.js',
    'injected/src/features/broker-protection/actions/click.js',
    'injected/src/features/broker-protection/actions/condition.js',
    'injected/src/features/broker-protection/actions/expectation.js',
    'injected/src/features/broker-protection/actions/extract.js',
    'injected/src/features/broker-protection/actions/fill-form.js',
    'injected/src/features/broker-protection/actions/generators.js',
    'injected/src/features/broker-protection/actions/navigate.js',
    'injected/src/features/broker-protection/actions/scroll.js',
    'injected/src/features/broker-protection/captcha-services/captcha.service.js',
    'injected/src/features/broker-protection/captcha-services/factory.js',
    'injected/src/features/broker-protection/captcha-services/get-captcha-container.js',
    'injected/src/features/broker-protection/captcha-services/get-captcha-provider.js',
    'injected/src/features/broker-protection/captcha-services/providers/cloudflare-turnstile.js',
    'injected/src/features/broker-protection/captcha-services/providers/hcaptcha.js',
    'injected/src/features/broker-protection/captcha-services/providers/image.js',
    'injected/src/features/broker-protection/captcha-services/providers/provider.interface.js',
    'injected/src/features/broker-protection/captcha-services/providers/recaptcha.js',
    'injected/src/features/broker-protection/captcha-services/providers/registry.js',
    'injected/src/features/broker-protection/captcha-services/utils/attribute.js',
    'injected/src/features/broker-protection/captcha-services/utils/element.js',
    'injected/src/features/broker-protection/captcha-services/utils/image.js',
    'injected/src/features/broker-protection/captcha-services/utils/sitekey.js',
    'injected/src/features/broker-protection/captcha-services/utils/stringify-function.js',
    'injected/src/features/broker-protection/captcha-services/utils/token.js',
    'injected/src/features/broker-protection/comparisons/address.js',
    'injected/src/features/broker-protection/comparisons/constants.js',
    'injected/src/features/broker-protection/comparisons/is-same-age.js',
    'injected/src/features/broker-protection/comparisons/is-same-name.js',
    'injected/src/features/broker-protection/execute.js',
    'injected/src/features/broker-protection/extractors/address.js',
    'injected/src/features/broker-protection/extractors/age.js',
    'injected/src/features/broker-protection/extractors/name.js',
    'injected/src/features/broker-protection/extractors/phone.js',
    'injected/src/features/broker-protection/extractors/profile-url.js',
    'injected/src/features/broker-protection/extractors/relatives.js',
    'injected/src/features/broker-protection/types.js',
    'injected/src/features/broker-protection/utils/expectations.js',
    'injected/src/features/broker-protection/utils/safe-call.js',
    'injected/src/features/broker-protection/utils/url.js',
    'injected/src/features/broker-protection/utils/utils.js',
    'injected/src/features/click-to-load.js',
    'injected/src/features/click-to-load/components/ctl-login-button.js',
    'injected/src/features/click-to-load/components/ctl-placeholder-blocked.js',
    'injected/src/features/click-to-load/components/index.js',
    'injected/src/features/click-to-load/ctl-assets.js',
    'injected/src/features/click-to-load/ctl-config.js',
    'injected/src/features/context-menu.js',
    'injected/src/features/cookie.js',
    'injected/src/features/duck-ai-chat-history.js',
    'injected/src/features/duck-ai-data-clearing.js',
    'injected/src/features/duck-player.js',
    'injected/src/features/duck-player-native.js',
    'injected/src/features/duckplayer/components/ddg-video-drawer-mobile.js',
    'injected/src/features/duckplayer/components/ddg-video-overlay.js',
    'injected/src/features/duckplayer/components/ddg-video-overlay-mobile.js',
    'injected/src/features/duckplayer/components/ddg-video-thumbnail-overlay-mobile.js',
    'injected/src/features/duckplayer/components/index.js',
    'injected/src/features/duckplayer/constants.js',
    'injected/src/features/duckplayer/environment.js',
    'injected/src/features/duckplayer/icon-overlay.js',
    'injected/src/features/duckplayer/overlay-messages.js',
    'injected/src/features/duckplayer/overlays.js',
    'injected/src/features/duckplayer/text.js',
    'injected/src/features/duckplayer/thumbnails.js',
    'injected/src/features/duckplayer/util.js',
    'injected/src/features/duckplayer/video-overlay.js',
    'injected/src/features/duckplayer-native/constants.js',
    'injected/src/features/duckplayer-native/custom-error/custom-error.js',
    'injected/src/features/duckplayer-native/error-detection.js',
    'injected/src/features/duckplayer-native/get-current-timestamp.js',
    'injected/src/features/duckplayer-native/messages.js',
    'injected/src/features/duckplayer-native/mute-audio.js',
    'injected/src/features/duckplayer-native/overlays/thumbnail-overlay.js',
    'injected/src/features/duckplayer-native/pause-video.js',
    'injected/src/features/duckplayer-native/sub-feature.js',
    'injected/src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js',
    'injected/src/features/duckplayer-native/sub-features/duck-player-native-serp.js',
    'injected/src/features/duckplayer-native/sub-features/duck-player-native-youtube.js',
    'injected/src/features/duckplayer-native/youtube-errors.js',
    'injected/src/features/element-hiding.js',
    'injected/src/features/exception-handler.js',
    'injected/src/features/favicon.js',
    'injected/src/features/fingerprinting-audio.js',
    'injected/src/features/fingerprinting-battery.js',
    'injected/src/features/fingerprinting-canvas.js',
    'injected/src/features/fingerprinting-hardware.js',
    'injected/src/features/fingerprinting-screen-size.js',
    'injected/src/features/fingerprinting-temporary-storage.js',
    'injected/src/features/google-rejected.js',
    'injected/src/features/gpc.js',
    'injected/src/features/harmful-apis.js',
    'injected/src/features/hover.js',
    'injected/src/features/message-bridge.js',
    'injected/src/features/message-bridge/create-page-world-bridge.js',
    'injected/src/features/message-bridge/schema.js',
    'injected/src/features/navigator-interface.js',
    'injected/src/features/page-context.js',
    'injected/src/features/page-observer.js',
    'injected/src/features/performance-metrics.js',
    'injected/src/features/print.js',
    'injected/src/features/referrer.js',
    'injected/src/features/ua-ch-brands.js',
    'injected/src/features/web-compat.js',
    'injected/src/features/web-detection.js',
    'injected/src/features/web-detection/matching.js',
    'injected/src/features/web-detection/parse.js',
    'injected/src/features/web-interference-detection.js',
    'injected/src/features/web-telemetry.js',
    'injected/src/features/windows-permission-usage.js',
]);

let output;
try {
    output = execSync('npx tsc -p tsconfig.strict-core.json --noEmit', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
} catch (e) {
    // tsc exits non-zero when there are errors — capture stderr+stdout
    output = (e.stdout || '') + (e.stderr || '');
}

const errors = output.split('\n').filter((line) => {
    const match = line.match(/^([^(]+)\(/);
    return match && CORE_FILES.has(match[1]);
});

if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} strict-mode error(s) in injected core files:\n`);
    errors.forEach((e) => console.error(e));
    process.exit(1);
} else {
    console.log('✅ All injected core files pass strict TypeScript checking.');
}
