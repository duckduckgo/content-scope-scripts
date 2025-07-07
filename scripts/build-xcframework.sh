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

# Check if Swift is available for proper building
if command -v swift &> /dev/null && command -v xcodebuild &> /dev/null; then
    # Test if we can actually build for iOS by checking destinations
    echo "Testing iOS build capability..."
    if xcodebuild -scheme ContentScopeScripts -showdestinations 2>/dev/null | grep -q "platform:iOS" && \
       ! (xcodebuild -scheme ContentScopeScripts -showdestinations 2>&1 | grep -q "error:iOS.*is not installed"); then
        echo "Swift, xcodebuild, and iOS platforms found - building proper xcframework"
        USE_SWIFT=true
    else
        echo "iOS platforms not properly available - falling back to resource-only framework"
        USE_SWIFT=false
    fi
else
    echo "Swift or xcodebuild not found - creating resource-only framework"
    USE_SWIFT=false
fi

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

if [ "$USE_SWIFT" = true ]; then
    echo "Building with Swift Package Manager..."
    
    # Copy Package.swift and Sources to build directory
    cp ../Package.swift .
    cp -r ../Sources .
    
    # Build frameworks for different platforms
    echo "Building for iOS (arm64)..."
    xcodebuild -scheme ContentScopeScripts \
        -destination "generic/platform=iOS" \
        -archivePath "ios-arm64.xcarchive" \
        archive -skipPackagePluginValidation
    
    echo "Building for iOS Simulator (arm64 + x86_64)..."
    xcodebuild -scheme ContentScopeScripts \
        -destination "generic/platform=iOS Simulator" \
        -archivePath "ios-simulator.xcarchive" \
        archive -skipPackagePluginValidation
    
    echo "Building for macOS (arm64 + x86_64)..."
    xcodebuild -scheme ContentScopeScripts \
        -destination "generic/platform=macOS" \
        -archivePath "macos.xcarchive" \
        archive -skipPackagePluginValidation
    
    # Create XCFramework using xcodebuild
    echo "Creating XCFramework from archives..."
    xcodebuild -create-xcframework \
        -framework "ios-arm64.xcarchive/Products/Library/Frameworks/${FRAMEWORK_NAME}.framework" \
        -framework "ios-simulator.xcarchive/Products/Library/Frameworks/${FRAMEWORK_NAME}.framework" \
        -framework "macos.xcarchive/Products/Library/Frameworks/${FRAMEWORK_NAME}.framework" \
        -output "${FRAMEWORK_NAME}.xcframework"

else
    echo "Creating resource-only framework structure..."

    # Create frameworks for different platforms
    PLATFORMS=("ios-arm64" "ios-arm64-simulator" "macos-arm64")

    for PLATFORM in "${PLATFORMS[@]}"; do
        FRAMEWORK_DIR="${FRAMEWORK_NAME}.framework"
        PLATFORM_DIR="$PLATFORM"
        
        echo "Creating framework for $PLATFORM..."
        
        mkdir -p "$PLATFORM_DIR/$FRAMEWORK_DIR"
        
        # Copy resources from the built output
        if [ -d "../Sources/ContentScopeScripts/dist" ]; then
            cp -r ../Sources/ContentScopeScripts/dist "$PLATFORM_DIR/$FRAMEWORK_DIR/"
            echo "Copied resources from Sources/ContentScopeScripts/dist"
        else
            echo "Warning: dist directory not found, creating empty resources"
            mkdir -p "$PLATFORM_DIR/$FRAMEWORK_DIR/dist"
        fi
        
        # Copy other necessary files
        cp -r ../Sources/ContentScopeScripts/ContentScopeScripts.swift "$PLATFORM_DIR/$FRAMEWORK_DIR/" 2>/dev/null || true
        
        # For resource-only frameworks, we need a minimal binary stub
        echo "Creating minimal binary stub..."
        mkdir -p "$PLATFORM_DIR/$FRAMEWORK_DIR/Versions/A"
        
        # Create a proper empty static library for the platform
        case "$PLATFORM" in
            "ios-arm64")
                echo "void ContentScopeScripts_dummy() {}" > dummy.c
                xcrun -sdk iphoneos clang -arch arm64 -c dummy.c -o dummy.o
                xcrun -sdk iphoneos ar rcs "$PLATFORM_DIR/$FRAMEWORK_DIR/Versions/A/$FRAMEWORK_NAME" dummy.o
                rm dummy.c dummy.o
                ;;
            "ios-arm64-simulator")
                echo "void ContentScopeScripts_dummy() {}" > dummy.c
                xcrun -sdk iphonesimulator clang -arch arm64 -c dummy.c -o dummy_arm64.o
                xcrun -sdk iphonesimulator clang -arch x86_64 -c dummy.c -o dummy_x86_64.o
                xcrun -sdk iphonesimulator lipo -create dummy_arm64.o dummy_x86_64.o -output dummy_universal.o
                xcrun -sdk iphonesimulator ar rcs "$PLATFORM_DIR/$FRAMEWORK_DIR/Versions/A/$FRAMEWORK_NAME" dummy_universal.o
                rm dummy.c dummy_arm64.o dummy_x86_64.o dummy_universal.o
                ;;
            "macos-arm64")
                echo "void ContentScopeScripts_dummy() {}" > dummy.c
                xcrun -sdk macosx clang -arch arm64 -arch x86_64 -c dummy.c -o dummy.o
                xcrun -sdk macosx ar rcs "$PLATFORM_DIR/$FRAMEWORK_DIR/Versions/A/$FRAMEWORK_NAME" dummy.o
                rm dummy.c dummy.o
                ;;
        esac
        
        ln -sf "Versions/A/$FRAMEWORK_NAME" "$PLATFORM_DIR/$FRAMEWORK_DIR/$FRAMEWORK_NAME"
        cd "$PLATFORM_DIR/$FRAMEWORK_DIR/Versions" && ln -sf "A" "Current" && cd ../../..
        
        # Create Info.plist
        case "$PLATFORM" in
            "ios-arm64")
                MIN_OS="14.0"
                PLATFORM_NAME="iPhoneOS"
                ;;
            "ios-arm64-simulator")
                MIN_OS="14.0"
                PLATFORM_NAME="iPhoneSimulator"
                ;;
            "macos-arm64")
                MIN_OS="10.15"
                PLATFORM_NAME="MacOSX"
                ;;
        esac
        
        cat > "$PLATFORM_DIR/$FRAMEWORK_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>$FRAMEWORK_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.duckduckgo.ContentScopeScripts</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$FRAMEWORK_NAME</string>
    <key>CFBundlePackageType</key>
    <string>FMWK</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>MinimumOSVersion</key>
    <string>$MIN_OS</string>
    <key>CFBundleSupportedPlatforms</key>
    <array>
        <string>$PLATFORM_NAME</string>
    </array>
</dict>
</plist>
EOF
    done

    # Create the XCFramework using xcodebuild
    XCFRAMEWORK_DIR="${FRAMEWORK_NAME}.xcframework"
    echo "Creating XCFramework..."

    xcodebuild -create-xcframework \
        -framework "ios-arm64/${FRAMEWORK_NAME}.framework" \
        -framework "ios-arm64-simulator/${FRAMEWORK_NAME}.framework" \
        -framework "macos-arm64/${FRAMEWORK_NAME}.framework" \
        -output "$XCFRAMEWORK_DIR"
fi

# Create zip file
echo "Creating XCFramework zip..."
zip -r "${FRAMEWORK_NAME}.xcframework.zip" "${FRAMEWORK_NAME}.xcframework"

# Copy to root directory for easy access
cp "${FRAMEWORK_NAME}.xcframework.zip" "../${FRAMEWORK_NAME}.xcframework.zip"

echo "XCFramework built successfully: ${FRAMEWORK_NAME}.xcframework.zip"
ls -la "${FRAMEWORK_NAME}.xcframework.zip"
echo "Also available at: ../${FRAMEWORK_NAME}.xcframework.zip"
ls -la "../${FRAMEWORK_NAME}.xcframework.zip" 