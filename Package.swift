// swift-tools-version:5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ContentScopeScripts",
    products: [
        .library(
            name: "ContentScopeScripts",
            targets: ["ContentScopeScripts"]),
    ],
    dependencies: [
    ],
    targets: [
        .target(
            name: "ContentScopeScripts",
            path: "Sources/ContentScopeScripts",
            resources: [
                .process("Resources/contentScope.js"),
                .process("Resources/contentScopeIsolated.js"),
                .process("Resources/duckAiDataClearing.js"),
                .copy("Resources/pages"),
            ]
        ),
    ]
)
