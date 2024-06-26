import Foundation

let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
process.arguments = ["bash", "-c", "npm install && npm run build"]
try process.run()
process.waitUntilExit()
