import { describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import * as path from 'node:path'

describe('Console', () => {
  describe('start', () => {
    it('should start cleanly and output goodbye when exiting', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')

        // Use tsx directly to run the typescript file
        const child = spawn('npx', ['tsx', scriptPath])

        let output = ''

        child.stdout.on('data', (data) => {
          output += data.toString()
          // Wait until REPL is ready
          if (output.includes('crowdfunding > ')) {
            child.stdin.end() // Close input stream to trigger 'exit' event
          }
        })

        child.stderr.on('data', (data) => {
          reject(new Error(`Unexpected stderr: ${data.toString()}`))
        })

        child.on('close', (code) => {
          try {
            expect(code).toBe(0)
            expect(output).toContain('Goodbye.')
            resolve()
          } catch (e) {
            reject(e)
          }
        })

        // Timeout safeguard
        const timeout = setTimeout(() => {
          child.kill()
          reject(new Error('Process timed out waiting for REPL prompt'))
        }, 5000)

        child.on('exit', () => clearTimeout(timeout))
      })
    })
  })
})
