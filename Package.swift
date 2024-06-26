// swift-tools-version:5.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ContentScopeScripts",
    products: [
        .executable(name: "build-node", targets: ["BuildNode"]),
        // Products define the executables and libraries a package produces, and make them visible to other packages.
        .library(
            name: "ContentScopeScripts",
            targets: ["ContentScopeScripts"]),
    ],
    dependencies: [
    ],
    targets: [
        .target(
            name: "BuildNode",
            dependencies: []),
        // Targets are the basic building blocks of a package. A target can define a module or a test suite.
        // Targets can depend on other targets in this package, and on products in packages this package depends on.
        .target(
            name: "ContentScopeScripts",
            dependencies: [],
            resources: [
                .process("dist/contentScope.js"),
                .process("dist/contentScopeIsolated.js"),
                .copy("dist/pages"),
            ]
        ),
    ]
)
