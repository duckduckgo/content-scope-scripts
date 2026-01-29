// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "content-scope-scripts",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v15),
        .macOS(.v11),
    ],
    products: [
        .library(
            name: "ContentScopeScripts",
            targets: ["ContentScopeScripts"]
        ),
    ],
    targets: [
        .target(
            name: "ContentScopeScripts",
            path: ".",
            sources: [
                "Sources/ContentScopeScripts",
            ],
            resources: [
                // Apple content scope scripts
                .copy("build/apple/contentScope.js"),
                .copy("build/apple/contentScopeIsolated.js"),
                .copy("build/apple/duckAiDataClearing.js"),
                // Duck:// pages used by Apple clients
                .copy("build/apple/pages"),
            ]
        ),
    ]
)

