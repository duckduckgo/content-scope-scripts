import Foundation

// Define the process
let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
process.arguments = ["bash", "-c", "npm install && npm run build-apple"]

do {
    // Run the process
    try process.run()
    process.waitUntilExit()

    // Check the exit status
    if process.terminationStatus == 0 {
        print("Node.js build succeeded.")
    } else {
        print("Node.js build failed.")
    }
} catch {
    print("An error occurred: \(error)")
}
