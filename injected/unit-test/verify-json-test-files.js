import { join, relative, extname } from 'node:path';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { cwd } from '../../scripts/script-utils.js';

import { createValidator, formatErrors } from '@duckduckgo/privacy-configuration/tests/schema-validation.js';
import { json } from 'node:stream/consumers';
// Fetch all integration test json files
const testPath = join(cwd(import.meta.url), '..', '..', 'injected', 'integration-test', 'test-pages');
// Find all json files in the testPath directory
const jsonFiles = [];
function findJsonFilesRecursively(directory) {
    const files = readdirSync(directory);
    for (const file of files) {
        const filePath = join(directory, file);
        if (statSync(filePath).isDirectory()) {
            findJsonFilesRecursively(filePath);
        } else if (statSync(filePath).isFile() && extname(file) === '.json' && filePath.includes('config')) {
            jsonFiles.push(filePath);
        }
    }
}

findJsonFilesRecursively(testPath);
// Create a validator for the privacy configuration schema
const validator = createValidator('GenericV4Config');

describe('check schema of integration test files', () => {
    for (const filePath of jsonFiles) {
        it(`should validate ${filePath}`, () => {
            const fileContent = readFileSync(filePath, 'utf8');
            const jsonContent = JSON.parse(fileContent);
            const validationResult = validator(jsonContent);
            if (!validationResult) {
                const errors = formatErrors(validator.errors);
                throw new Error(`Validation failed for ${filePath}: ${errors}`);
            }
            expect(validationResult).toBe(true);
            // Check if the file is a valid JSON file
            expect(fileContent).toBeTruthy();
            // Check if the file is a valid JSON object
            expect(jsonContent).toBeTruthy();
        });
    }
});
