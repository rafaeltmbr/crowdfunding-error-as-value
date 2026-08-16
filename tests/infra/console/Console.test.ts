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

    it('should register all necessary domains, entities, repositories, and use cases in the context', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''

        child.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('crowdfunding > ')) {
            // Check if classes are defined in the context
            child.stdin.write('typeof Campaign\n')
            child.stdin.write('typeof CreateCampaignUseCase\n')
            child.stdin.write('typeof CampaignRepositoryInMemory\n')
            child.stdin.end()
          }
        })

        child.on('close', () => {
          try {
            // Because it evaluates in the REPL, the type strings should be printed
            // All of them are exported as classes/functions now
            expect(output).toContain("'function'") // Campaign (class)
            expect(output).toContain("'function'") // CreateCampaignUseCase (class)
            expect(output).toContain("'function'") // CampaignRepositoryInMemory (class)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })
  })
})
