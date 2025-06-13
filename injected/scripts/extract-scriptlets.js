#!/usr/bin/env node

/**
 * Build-time script to extract only the scriptlet functions we actually use
 * This creates a minimal bundle instead of including the entire @adguard/scriptlets package
 */

import { scriptlets } from '@adguard/scriptlets';
import { writeFileSync } from 'fs';
import { join } from 'path';

// List of scriptlet functions we actually use
const NEEDED_FUNCTIONS = [
    'set-cookie',
    'trusted-set-cookie', 
    'set-cookie-reload',
    'remove-cookie',
    'set-constant',
    'set-local-storage-item',
    'abort-current-inline-script',
    'abort-on-property-read',
    'abort-on-property-write',
    'prevent-addEventListener',
    'prevent-window-open',
    'prevent-setTimeout',
    'remove-node-text',
    'prevent-fetch'
];

// Generate the minimal scriptlets module
function generateMinimalScriptlets() {
    const functions = [];
    
    for (const functionName of NEEDED_FUNCTIONS) {
        const func = scriptlets.getScriptletFunction(functionName);
        if (!func) {
            console.warn(`Warning: Function ${functionName} not found`);
            continue;
        }
        
        // Convert kebab-case to camelCase for export names
        const exportName = functionName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        
        // Get the function source code
        const functionSource = func.toString();
        
        // Add the function
        functions.push(`// ${functionName}`);
        functions.push(`export const ${exportName} = ${functionSource};`);
        functions.push('');
    }
    
    const moduleContent = `// @ts-nocheck
/**
 * Minimal scriptlets module - AUTO-GENERATED
 * Contains only the scriptlet functions actually used by this project
 * Generated from @adguard/scriptlets v${process.env.npm_package_dependencies__adguard_scriptlets || 'unknown'}
 * 
 * TypeScript checking is disabled for this auto-generated file.
 */

${functions.join('\n')}
`;
    
    return moduleContent;
}

// Write the minimal module
const outputPath = join(process.cwd(), 'src/features/scriptlets-minimal.js');
const moduleContent = generateMinimalScriptlets();

writeFileSync(outputPath, moduleContent, 'utf8');

console.log(`✅ Generated minimal scriptlets module: ${outputPath}`);
console.log(`📦 Included ${NEEDED_FUNCTIONS.length} functions instead of the entire @adguard/scriptlets package`);
console.log(`🎯 Functions: ${NEEDED_FUNCTIONS.join(', ')}`); 