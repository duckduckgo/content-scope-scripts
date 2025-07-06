#!/bin/bash
set -e

npm run build

# Start the test page server in the background
nohup npm run serve > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for the server to be ready
npx wait-on http://localhost:3220/index.html

# Run web-ext
npx web-ext run --source-dir=integration-test/extension --target=chromium --start-url=http://localhost:3220/index.html --start-url=https://privacy-test-pages.site

# Cleanup: kill the server after web-ext closes
kill $SERVER_PID 