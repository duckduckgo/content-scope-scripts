import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

// The build imports .css files as text (esbuild's text loader), which Node can't do on its own.
registerHooks({
    load(url, context, nextLoad) {
        if (!url.endsWith('.css')) return nextLoad(url, context);
        const css = readFileSync(new URL(url), 'utf8');
        return { format: 'module', source: `export default ${JSON.stringify(css)};`, shortCircuit: true };
    },
});
