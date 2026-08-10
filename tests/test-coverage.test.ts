// tests/test-coverage.test.ts
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import ts from 'typescript'

// Helper to recursively find all .ts files without relying on external dependencies like glob
function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      getAllTsFiles(fullPath, fileList)
    } else if (fullPath.endsWith('.ts')) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

describe('Test Coverage Standards', () => {
  it('every class in app, domain, and infra should have its own test suite', () => {
    const srcDir = path.resolve(__dirname, '../src')
    const dirsToCheck = ['app', 'domain', 'infra']

    for (const dir of dirsToCheck) {
      const targetDir = path.join(srcDir, dir)
      const tsFiles = getAllTsFiles(targetDir)

      for (const fullFilePath of tsFiles) {
        const fileContent = fs.readFileSync(fullFilePath, 'utf8')

        // Parse the AST for the file using the TypeScript Compiler API
        const sourceFile = ts.createSourceFile(
          fullFilePath,
          fileContent,
          ts.ScriptTarget.Latest,
          true // setParentNodes
        )

        const classNames: string[] = []

        // Traverse the AST to find exported class declarations
        function visit(node: ts.Node) {
          if (ts.isClassDeclaration(node) && node.name) {
            const isExported =
              ts.canHaveModifiers(node) &&
              ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
            if (isExported) {
              classNames.push(node.name.text)
            }
          }
          ts.forEachChild(node, visit)
        }
        visit(sourceFile)

        // If there are no classes in this file, move on to the next
        if (classNames.length === 0) continue

        // Determine the expected test file path
        const relativeFilePath = path.relative(srcDir, fullFilePath)
        const expectedTestFile = relativeFilePath.replace(/\.ts$/, '.test.ts')
        const fullTestFilePath = path.join(__dirname, expectedTestFile)

        expect(
          fs.existsSync(fullTestFilePath),
          `Missing test file. File src/${relativeFilePath} exports classes, so tests/${expectedTestFile} must exist.`
        ).toBe(true)

        // Read the test file and ensure a `describe` block exists for every class
        const testContent = fs.readFileSync(fullTestFilePath, 'utf8')

        for (const className of classNames) {
          // This regex ensures we match exact class name block, e.g., describe('ClassName', ...)
          const describeRegex = new RegExp(`describe\\(['"\`]${className}['"\`]\\s*,`)

          expect(
            describeRegex.test(testContent),
            `Test file tests/${expectedTestFile} exists, but is missing test suite: describe('${className}', ...)`
          ).toBe(true)
        }
      }
    }
  })
})
