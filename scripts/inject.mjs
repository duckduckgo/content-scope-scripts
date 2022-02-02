import { readFile } from 'fs/promises';
import * as rollup from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import dynamicImportVariables from 'rollup-plugin-dynamic-import-variables';


async function generateContentScope() {
    let mozProxies = false;
    // The code is using a global, that we define here which means once tree shaken we get a browser specific output.
    if (process.argv[2] == "firefox") {
        mozProxies = true;
    }
    const inputOptions = {
        input: 'src/content-scope-features.js',
        plugins: [
            resolve(),
            dynamicImportVariables({}),
            commonjs(),
            replace({
                preventAssignment: true,
                values: {
                    mozProxies
                }
            })
        ]
    };
    const outputOptions = {
        dir: 'build',
        format: 'iife',
        inlineDynamicImports: true,
        name: 'contentScopeFeatures',
        // This if for seedrandom causing build issues
        globals: { crypto: 'undefined' }
    };

    const bundle = await rollup.rollup(inputOptions);
    const generated = await bundle.generate(outputOptions);
    return generated.output[0].code;
}

async function init() {
    if (process.argv.length != 3) {
        throw new Error("Specify the build type as an argument to this script.");
    }
    if (process.argv[2] == "firefox") {
        initOther('inject/mozilla.js');
    } else if (process.argv[2] == "apple") {
        initApple();
    } else if (process.argv[2] == "integration") {
        initOther('inject/integration.js');
    } else {
        initChrome();
    }
}

async function initOther(injectScriptPath) {
    const replaceString = "/* global contentScopeFeatures */";
    const injectScript = await readFile(injectScriptPath);
    const contentScope = await generateContentScope();
    const outputScript = injectScript.toString().replace(replaceString, contentScope.toString());
    console.log(outputScript);
}

async function initApple() {
    const contentScopeReplaceString = "/* global contentScopeFeatures */";
    const appleUtilsReplaceString = "/* global appleUtils */";
    const injectScriptPath = "inject/apple.js";
    const injectScript = await readFile(injectScriptPath);

    const appleUtilScript = await readFile("src/apple-utils.js");
    const utilScriptStr = appleUtilScript.toString().replace('export ', ''); // Remove the export keyword for compatibility

    const contentScope = await generateContentScope();
    const outputScript = injectScript.toString()
                                .replace(contentScopeReplaceString, contentScope.toString())
                                .replace(appleUtilsReplaceString, utilScriptStr);
    console.log(outputScript);
}

async function initChrome() {
    const replaceString = "/* global contentScopeFeatures */";
    const injectScriptPath = "inject/chrome.js";
    const injectScript = await readFile(injectScriptPath);
    const contentScope = await generateContentScope();
    // Encode in URI format to prevent breakage (we could choose to just escape ` instead)
    const encodedString = encodeURI(contentScope.toString());
    const outputScript = injectScript.toString().replace(replaceString, '${decodeURI("' + encodedString + '")}');
    console.log(outputScript);
}

init();
