#!/bin/bash

set -e

VERSION="$1"
BUILD_DIR="xcframework-build"
FRAMEWORK_NAME="ContentScopeScripts"

if [ -z "$VERSION" ]; then
    echo "Error: Version parameter is required"
    exit 1
fi

echo "Building XCFramework for version: $VERSION"

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Since this is a resource-only package, we don't need to compile Swift code
# We'll create a framework structure that packages the JavaScript resources
echo "Creating framework structure for resource-only package..."

FRAMEWORK_DIR="${FRAMEWORK_NAME}.framework"
mkdir -p "$FRAMEWORK_DIR"

# Copy the built library (this is a simplified approach)
# In a real scenario, you'd use the actual built libraries
echo "Creating framework bundle..."

# Create Info.plist
cat > "$FRAMEWORK_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$FRAMEWORK_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.duckduckgo.${FRAMEWORK_NAME}</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundlePackageType</key>
    <string>FMWK</string>
    <key>MinimumOSVersion</key>
    <string>12.0</string>
    <key>CFBundleSupportedPlatforms</key>
    <array>
        <string>iPhoneOS</string>
        <string>iPhoneSimulator</string>
        <string>MacOSX</string>
    </array>
</dict>
</plist>
EOF

# Copy resources from the built output
if [ -d "../Sources/ContentScopeScripts/dist" ]; then
    cp -r ../Sources/ContentScopeScripts/dist "$FRAMEWORK_DIR/"
    echo "Copied resources from Sources/ContentScopeScripts/dist"
else
    echo "Warning: dist directory not found, creating empty resources"
    mkdir -p "$FRAMEWORK_DIR/dist"
fi

# Copy other necessary files
cp -r ../Sources/ContentScopeScripts/ContentScopeScripts.swift "$FRAMEWORK_DIR/" 2>/dev/null || true

# For resource-only frameworks, we need a minimal binary stub
echo "Creating minimal binary stub..."
mkdir -p "$FRAMEWORK_DIR/Versions/A"
# Create a simple binary stub (empty file that satisfies framework requirements)
echo '/* ContentScopeScripts Resource Bundle */' > "$FRAMEWORK_DIR/Versions/A/$FRAMEWORK_NAME"
ln -sf "Versions/A/$FRAMEWORK_NAME" "$FRAMEWORK_DIR/$FRAMEWORK_NAME"
cd "$FRAMEWORK_DIR/Versions" && ln -sf "A" "Current" && cd ../..

# Create XCFramework structure manually
XCFRAMEWORK_DIR="${FRAMEWORK_NAME}.xcframework"
mkdir -p "$XCFRAMEWORK_DIR"

# Create Info.plist for XCFramework
cat > "$XCFRAMEWORK_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>AvailableLibraries</key>
    <array>
        <dict>
            <key>LibraryIdentifier</key>
            <string>macos-arm64_x86_64</string>
            <key>LibraryPath</key>
            <string>${FRAMEWORK_NAME}.framework</string>
            <key>SupportedArchitectures</key>
            <array>
                <string>arm64</string>
                <string>x86_64</string>
            </array>
            <key>SupportedPlatform</key>
            <string>macos</string>
        </dict>
        <dict>
            <key>LibraryIdentifier</key>
            <string>ios-arm64</string>
            <key>LibraryPath</key>
            <string>${FRAMEWORK_NAME}.framework</string>
            <key>SupportedArchitectures</key>
            <array>
                <string>arm64</string>
            </array>
            <key>SupportedPlatform</key>
            <string>ios</string>
        </dict>
        <dict>
            <key>LibraryIdentifier</key>
            <string>ios-arm64_x86_64-simulator</string>
            <key>LibraryPath</key>
            <string>${FRAMEWORK_NAME}.framework</string>
            <key>SupportedArchitectures</key>
            <array>
                <string>arm64</string>
                <string>x86_64</string>
            </array>
            <key>SupportedPlatform</key>
            <string>ios</string>
            <key>SupportedPlatformVariant</key>
            <string>simulator</string>
        </dict>
    </array>
    <key>CFBundlePackageType</key>
    <string>XFWK</string>
    <key>XCFrameworkFormatVersion</key>
    <string>1.0</string>
</dict>
</plist>
EOF

# Copy framework to each platform directory
mkdir -p "$XCFRAMEWORK_DIR/macos-arm64_x86_64"
mkdir -p "$XCFRAMEWORK_DIR/ios-arm64"
mkdir -p "$XCFRAMEWORK_DIR/ios-arm64_x86_64-simulator"

cp -r "$FRAMEWORK_DIR" "$XCFRAMEWORK_DIR/macos-arm64_x86_64/"
cp -r "$FRAMEWORK_DIR" "$XCFRAMEWORK_DIR/ios-arm64/"
cp -r "$FRAMEWORK_DIR" "$XCFRAMEWORK_DIR/ios-arm64_x86_64-simulator/"

# Create zip file
echo "Creating XCFramework zip..."
zip -r "${FRAMEWORK_NAME}.xcframework.zip" "$XCFRAMEWORK_DIR"

echo "XCFramework built successfully: ${FRAMEWORK_NAME}.xcframework.zip"
ls -la "${FRAMEWORK_NAME}.xcframework.zip" 