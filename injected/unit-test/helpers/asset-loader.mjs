import { register } from 'node:module';

/**
 * The esbuild bundle imports .svg/.css files as text (scripts/utils/build.js),
 * but plain Node — which runs these Jasmine specs — has no loader for them, so
 * any spec importing a feature that imports an asset fails with
 * ERR_UNKNOWN_FILE_EXTENSION. This registers a loader hook mirroring the
 * bundler's behavior: asset imports resolve to their file content as a string.
 */
register(new URL('./asset-loader-hooks.mjs', import.meta.url));
