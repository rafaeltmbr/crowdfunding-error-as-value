import fs from 'node:fs'
import path from 'node:path'

const ALIASES = {
  '@app': 'src/app',
  '@domain': 'src/domain',
  '@infra': 'src/infra',
}

function resolveImportPath(importSource, currentFilePath, cwd) {
  if (importSource.startsWith('.')) {
    return path.resolve(path.dirname(currentFilePath), importSource)
  }

  for (const [alias, target] of Object.entries(ALIASES)) {
    if (importSource === alias || importSource.startsWith(`${alias}/`)) {
      const relativePath = importSource.replace(alias, target)
      return path.resolve(cwd, relativePath)
    }
  }

  return null
}

function hasIndexFile(dirPath) {
  try {
    return (
      fs.existsSync(path.join(dirPath, 'index.ts')) || fs.existsSync(path.join(dirPath, 'index.js'))
    )
  } catch {
    return false
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that directories with an index.ts file are only accessed through the index file.',
    },
    schema: [],
    messages: {
      barrelViolation:
        "The directory '{{dirName}}' has an index file. You must import through the index instead of accessing internal files directly.",
    },
  },
  create(context) {
    const cwd = context.cwd || process.cwd()
    const currentFilePath = context.filename || context.getFilename()

    function checkImport(node, importSource) {
      if (!importSource || typeof importSource !== 'string') return

      const resolvedPath = resolveImportPath(importSource, currentFilePath, cwd)
      if (!resolvedPath) return

      let importedIsDir = false
      try {
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
          importedIsDir = true
        }
      } catch {}

      const targetDir = importedIsDir ? resolvedPath : path.dirname(resolvedPath)

      let boundaryDir = null
      let currentDir = targetDir
      const rootDir = path.resolve(cwd, 'src')

      while (currentDir.startsWith(rootDir) && currentDir !== rootDir) {
        if (hasIndexFile(currentDir)) {
          boundaryDir = currentDir
          break
        }
        currentDir = path.dirname(currentDir)
      }

      if (!boundaryDir) return

      // If the current file is inside the boundary directory, internal imports are allowed.
      if (currentFilePath.startsWith(boundaryDir + path.sep) || currentFilePath === boundaryDir) {
        return
      }

      // If outside, the import must point directly to the boundary directory or its index file.
      const isImportingBoundary =
        resolvedPath === boundaryDir || resolvedPath === path.join(boundaryDir, 'index')

      if (!isImportingBoundary) {
        context.report({
          node,
          messageId: 'barrelViolation',
          data: {
            dirName: path.basename(boundaryDir),
          },
        })
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source) checkImport(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkImport(node, node.source.value)
      },
      ExportAllDeclaration(node) {
        if (node.source) checkImport(node, node.source.value)
      },
    }
  },
}
