const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const exePath = path.join(__dirname, '..', 'dist', 'win-unpacked', 'FlowZik.exe')
const icoPath = path.join(__dirname, '..', 'resources', 'icon.ico')
const rceditBin = path.join(__dirname, '..', 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe')

if (!fs.existsSync(exePath)) {
  console.error('FlowZik.exe not found — run "npm run build && electron-builder --dir" first')
  process.exit(1)
}

function run(args, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      execFileSync(rceditBin, [exePath, ...args])
      return
    } catch (err) {
      if (i < retries - 1) {
        const delay = (i + 1) * 1000
        console.log(`  retrying in ${delay}ms...`)
        const start = Date.now()
        while (Date.now() - start < delay) { /* busy wait */ }
      } else {
        throw err
      }
    }
  }
}

const pkg = require('../package.json')

console.log('Setting icon...')
run(['--set-icon', icoPath])

console.log('Setting version strings...')
const strings = {
  ProductName: 'FlowZik',
  FileDescription: 'FlowZik - Desktop Kanban Board',
  CompanyName: 'zikkey',
  LegalCopyright: 'Copyright (c) 2026 zikkey',
  OriginalFilename: 'FlowZik.exe',
}
for (const [key, value] of Object.entries(strings)) {
  run(['--set-version-string', key, value])
}
run(['--set-file-version', pkg.version])
run(['--set-product-version', pkg.version])

console.log('Done — exe patched successfully')
