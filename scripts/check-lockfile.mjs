#!/usr/bin/env node
/**
 * Validates that package-lock.json is in sync with package.json (root + workspaces).
 * Run this in CI before install steps to catch lockfile drift early with a clear error.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix as pathPosix } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..');

function readJson(filePath) {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Failed to read JSON from ${filePath}: ${message}`);
    }
}

function toFsPath(posixRelativePath) {
    // package-lock.json uses POSIX-ish keys even on Windows.
    return join(rootDir, ...posixRelativePath.split('/'));
}

const pkgRoot = readJson(join(rootDir, 'package.json'));
const lock = readJson(join(rootDir, 'package-lock.json'));

if (!lock?.packages) {
    console.error('❌ package-lock.json is missing "packages" entries (unsupported lockfile format)');
    process.exit(1);
}

const errors = [];

function normalizeSpecifier(spec) {
    // Normalize github shorthand to match lockfile format
    // "github:org/repo#tag" stays as is in lockfile
    return spec;
}

function checkDeps(pkgDeps, lockDepsMap, type, packageLabel) {
    const pkgDepsMap = pkgDeps || {};
    const lockMap = lockDepsMap || {};

    for (const [name, specifier] of Object.entries(pkgDepsMap)) {
        if (typeof specifier === 'string' && specifier.startsWith('file:')) continue;

        const lockSpecifier = lockMap[name];
        const normalizedPkgSpec = normalizeSpecifier(specifier);

        if (!lockSpecifier) {
            errors.push(`${packageLabel}: ${type} "${name}" not found in package-lock.json`);
        } else if (lockSpecifier !== normalizedPkgSpec) {
            errors.push(
                `${packageLabel}: ${type} "${name}" version mismatch:\n` +
                    `    package.json:      ${specifier}\n` +
                    `    package-lock.json: ${lockSpecifier}`,
            );
        }
    }

    for (const name of Object.keys(lockMap)) {
        if (!pkgDepsMap[name]) {
            errors.push(`${packageLabel}: ${type} "${name}" in package-lock.json but not in package.json`);
        }
    }
}

function validatePackage(pkgPathKey, pkgJson, lockEntry) {
    const label = pkgPathKey === '' ? 'root' : pkgPathKey;
    if (!lockEntry) {
        errors.push(`${label}: package not found in package-lock.json "packages" map`);
        return;
    }

    checkDeps(pkgJson.dependencies, lockEntry.dependencies, 'dependency', label);
    checkDeps(pkgJson.devDependencies, lockEntry.devDependencies, 'devDependency', label);
}

// Root package
validatePackage('', pkgRoot, lock.packages['']);

// Workspace packages
function getWorkspaceSpecs(workspaces) {
    if (Array.isArray(workspaces)) return workspaces;
    if (workspaces && typeof workspaces === 'object' && Array.isArray(workspaces.packages)) return workspaces.packages;
    return [];
}

function expandWorkspaceSpec(spec) {
    if (!spec.includes('*')) return [spec];

    // Support the common "dir/*" pattern.
    if (!spec.endsWith('/*')) {
        errors.push(`root: unsupported workspace pattern "${spec}" (only trailing "/*" is supported)`);
        return [];
    }

    const base = spec.slice(0, -2);
    const baseFs = toFsPath(base);

    let entries = [];
    try {
        entries = readdirSync(baseFs, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => pathPosix.join(base, d.name));
    } catch {
        // If the base directory doesn't exist, treat as empty (npm would also have nothing to load).
        return [];
    }

    // Keep only directories that actually contain a package.json
    return entries.filter((p) => {
        try {
            statSync(join(toFsPath(p), 'package.json'));
            return true;
        } catch {
            return false;
        }
    });
}

const workspacePaths = getWorkspaceSpecs(pkgRoot.workspaces).flatMap(expandWorkspaceSpec);
for (const workspacePath of workspacePaths) {
    const workspacePkg = readJson(join(toFsPath(workspacePath), 'package.json'));
    const lockEntry = lock.packages[workspacePath];
    validatePackage(workspacePath, workspacePkg, lockEntry);
}

if (errors.length > 0) {
    console.error('❌ package-lock.json is out of sync with package.json:\n');
    errors.forEach((e) => console.error(`  - ${e}\n`));
    console.error('Run `npm install` to update package-lock.json');
    process.exit(1);
}

console.log('✓ package-lock.json is in sync with package.json');
