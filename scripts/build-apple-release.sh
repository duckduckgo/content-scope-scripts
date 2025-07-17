#!/bin/bash

set -e

VERSION="$1"
BUILD_DIR="apple-release-build"
OUTPUT_NAME="ContentScopeScripts-apple"
OUTPUT_FILE="ContentScopeScripts-apple.zip"

if [ -z "$VERSION" ]; then
    echo "Error: Version parameter is required"
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Building Apple release for version: $VERSION"

# Check if Apple build folder exists
if [ ! -d "build/apple" ]; then
    echo "Error: build/apple directory not found"
    echo "Make sure to run 'npm run build' first to generate the Apple build files"
    exit 1
fi

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Copying Apple build contents..."
cp -r "../build/apple/"* "./"

echo "Creating release zip..."
zip -r "${OUTPUT_FILE}" .

# Copy to root directory for easy access
cp "${OUTPUT_FILE}" "../${OUTPUT_FILE}"

echo "Apple release built successfully: ${OUTPUT_FILE}"
echo "Contents:"
echo "  - contentScope.js ($(du -h contentScope.js | cut -f1))"
echo "  - contentScopeIsolated.js ($(du -h contentScopeIsolated.js | cut -f1))"
echo "  - pages/ directory with $(ls pages/ | wc -l) special pages"
echo "  - Install command: ./scripts/update_content_scope_scripts.sh ${VERSION}"

ls -la "../${OUTPUT_FILE}"

# Clean up temporary directory
cd ..
rm -rf "$BUILD_DIR"
echo "Cleaned up temporary directory: ${BUILD_DIR}" 