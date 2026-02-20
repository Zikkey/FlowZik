const fs = require('fs')
const path = require('path')
const { rcedit } = require('rcedit')

// Files that are not needed for a Kanban app and can be safely removed.
// dxcompiler/dxil = WebGPU shader compiler (25+1.5 MB)
// vk_swiftshader = Vulkan software fallback (5.4 MB)
// vulkan-1.dll = Vulkan loader (0.9 MB)
// LICENSES.chromium.html = license text (16 MB)
const REMOVE_FILES = [
  'dxcompiler.dll',
  'dxil.dll',
  'vk_swiftshader.dll',
  'vk_swiftshader_icd.json',
  'vulkan-1.dll',
  'LICENSES.chromium.html',
]

exports.default = async function afterPack(context) {
  const dir = context.appOutDir
  let saved = 0

  for (const name of REMOVE_FILES) {
    const filePath = path.join(dir, name)
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size
      fs.unlinkSync(filePath)
      saved += size
      console.log(`  removed ${name} (${(size / 1024 / 1024).toFixed(1)} MB)`)
    }
  }

  if (saved > 0) {
    console.log(`  total saved: ${(saved / 1024 / 1024).toFixed(1)} MB`)
  }

  // Patch exe with custom icon and version info (since signAndEditExecutable is false)
  const exePath = path.join(dir, `${context.packager.appInfo.productFilename}.exe`)
  const icoPath = path.resolve(__dirname, '..', 'resources', 'icon.ico')

  if (fs.existsSync(exePath) && fs.existsSync(icoPath)) {
    console.log('  patching exe icon and version info...')
    const pkg = require('../package.json')
    await rcedit(exePath, {
      icon: icoPath,
      'version-string': {
        ProductName: 'FlowZik',
        FileDescription: 'FlowZik — Desktop Kanban Board',
        CompanyName: 'zikkey',
        LegalCopyright: 'Copyright (c) 2026 zikkey',
        OriginalFilename: 'FlowZik.exe',
      },
      'file-version': pkg.version,
      'product-version': pkg.version,
    })
    console.log('  exe patched successfully')
  }
}
