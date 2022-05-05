// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ContentScopeScripts",
    products: [
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "ContentScopeScripts",
            targets: ["ContentScopeScripts"]),
    ],
    dependencies: [
    ],
    targets: [
        .target(
            name: "ContentScopeScripts",
            path: "swift-package/Resources/",
            resources: [
                .process("assets")
            ]
        ),
    ]
)
