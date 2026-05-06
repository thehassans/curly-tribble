const path = require('path')
const { pathToFileURL } = require('url')

const backendRoot = path.join(__dirname, 'backend')
const backendEntry = path.join(backendRoot, 'src', 'index.js')

try {
  process.chdir(backendRoot)
} catch (err) {
  console.error('[passenger-bootstrap] Failed to switch to backend directory:', err)
  process.exit(1)
}

import(pathToFileURL(backendEntry).href).catch((err) => {
  console.error('[passenger-bootstrap] Failed to start backend entry:', err)
  process.exit(1)
})
