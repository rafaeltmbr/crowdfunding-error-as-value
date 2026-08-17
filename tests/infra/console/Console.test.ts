import { describe, expect, it, vi, afterEach } from 'vitest'
import { spawn } from 'node:child_process'
import * as path from 'node:path'
import * as repl from 'node:repl'
import { Console } from '../../../src/infra/console/Console'
import { ReplHelper } from '../../../src/infra/console/ReplHelper'
import { Exception } from '@values/Exception'

vi.mock('node:repl', () => ({
  start: vi.fn(),
}))

describe('Console', () => {
  describe('start', () => {
    it('should start cleanly and output goodbye when exiting', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''

        child.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('crowdfunding > ')) {
            child.stdin.write('.exit\n')
          }
        })

        child.on('close', (code) => {
          try {
            expect(output).toContain('Goodbye.')
            expect(code).toBe(0)
            resolve()
          } catch (e) {
            reject(e)
          }
        })
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
            // Check some globally injected context variables
            child.stdin.write('Object.keys(global).filter(k => k !== "global").join(", ")\n')
            child.stdin.end()
          }
        })

        child.on('close', () => {
          try {
            // Values
            expect(output).toContain('Email')
            expect(output).toContain('Exception')
            expect(output).toContain('Result')
            // Entities
            expect(output).toContain('Campaign')
            expect(output).toContain('Donation')
            // Repositories
            expect(output).toContain('CampaignRepositoryInMemory')
            // Use Cases
            expect(output).toContain('CreateCampaignUseCase')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })

    it('should auto-unwrap Result objects in assignments and nested calls', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''

        child.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('crowdfunding > ')) {
            // Write the commands
            child.stdin.write('const c = Campaign.make(Name.make("My campaign"))\n')
            child.stdin.write('c\n')
            child.stdin.end()
          }
        })

        child.on('close', () => {
          try {
            // The output of 'c' should be the actual Campaign instance (now snapshotted)
            expect(output).toContain('Campaign {')
            expect(output).toContain('name:')
            expect(output).toContain('My campaign')
            expect(output).toContain('CampaignFunding {')
            // Ensure no Result unwrap failures occurred
            expect(output).not.toContain('Uncaught')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })

    it('should persist commands in history across sessions (state verification)', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const randomCmd = `const random_${Math.floor(Math.random() * 100000)} = ${Math.random()}`

        // Session 1: Write command
        const child1 = spawn('npx', ['tsx', scriptPath])
        let output1 = ''
        let child1Triggered = false

        child1.stdout.on('data', (data) => {
          output1 += data.toString()
          if (output1.includes('crowdfunding > ') && !child1Triggered) {
            child1Triggered = true
            child1.stdin.write(`${randomCmd}\n`)
            setTimeout(() => {
              child1.stdin.write('.exit\n')
            }, 300)
          }
        })

        child1.on('close', () => {
          // Session 2: Read from history using UP arrow
          const child2 = spawn('npx', ['tsx', scriptPath])
          let output2 = ''
          let child2Triggered = false

          child2.stdout.on('data', (data) => {
            output2 += data.toString()
            if (output2.includes('crowdfunding > ') && !child2Triggered) {
              child2Triggered = true
              child2.stdin.write('\x1B[A\n')
              setTimeout(() => {
                child2.stdin.write('.exit\n')
              }, 300)
            }
          })

          child2.on('close', () => {
            try {
              // The output should contain the random command retrieved from history
              expect(output2).toContain(randomCmd)
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        })
      })
    }, 15000)

    it('should log an error if history fails to load (state verification)', () => {
      return new Promise<void>((resolve, reject) => {
        const fs = require('node:fs')
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const historyPath = path.resolve(__dirname, '../../../.console_history')

        // Remove file and create directory to force error
        if (fs.existsSync(historyPath)) {
          fs.rmSync(historyPath, { recursive: true, force: true })
        }
        fs.mkdirSync(historyPath)

        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''

        child.stdout.on('data', (data) => {
          output += data.toString()
        })

        child.stderr.on('data', (data) => {
          output += data.toString()
        })

        setTimeout(() => {
          child.stdin.write('.exit\n')
        }, 300)

        child.on('close', () => {
          // Cleanup
          fs.rmSync(historyPath, { recursive: true, force: true })

          try {
            expect(output).toContain('Could not open history file')
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    }, 15000)
  })

  describe('Console instance', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should start the REPL, load context, and handle exit', async () => {
      const consoleApp = new Console()
      const mockOn = vi.fn()
      const mockReplServer = {
        context: {},
        on: mockOn,
        setupHistory: vi.fn((file, cb) => cb(null)),
      } as unknown as repl.REPLServer

      vi.mocked(repl.start).mockReturnValue(mockReplServer)

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await consoleApp.start()

      // Check repl start config
      expect(repl.start).toHaveBeenCalledWith({
        prompt: 'crowdfunding > ',
        useColors: true,
        writer: ReplHelper.consoleWriter,
        terminal: true,
      })

      // Check context population
      expect(mockReplServer.context).toHaveProperty('Email')
      expect(mockReplServer.context).toHaveProperty('Campaign')
      expect(mockReplServer.context).toHaveProperty('CreateCampaignUseCase')

      // Check graceful shutdown hook
      expect(mockOn).toHaveBeenCalledWith('exit', expect.any(Function))

      // Trigger the exit callback manually
      const exitCallback = mockOn.mock.calls.find((call) => call[0] === 'exit')![1]
      exitCallback()

      expect(logSpy).toHaveBeenCalledWith('Goodbye.')
      expect(exitSpy).toHaveBeenCalledWith(0)
    })

    it('should handle unreachable defensive branch when setupHistory fails', async () => {
      const consoleApp = new Console()
      const mockReplServer = {
        context: {},
        on: vi.fn(),
        setupHistory: vi.fn((file, cb) => cb(new Error('Unreachable error'))),
      } as unknown as repl.REPLServer

      vi.mocked(repl.start).mockReturnValue(mockReplServer)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await consoleApp.start()

      expect(errorSpy).toHaveBeenCalledWith('Failed to load console history:', expect.any(Error))
    })
  })

  describe('REPL evaluation', () => {
    it('should catch auto-unwrapped domain exceptions and display them', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''
        let triggered = false

        child.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('crowdfunding > ') && !triggered) {
            triggered = true
            // This will auto-unwrap a Result.fail and throw an Exception
            child.stdin.write('Name.make("")\n')
            setTimeout(() => {
              child.stdin.write('.exit\n')
            }, 300)
          }
        })

        child.stderr.on('data', (data) => {
          output += data.toString()
        })

        child.on('close', () => {
          try {
            // It should output the Exception details
            expect(output).toContain('Validation')
            expect(output).toContain('NAME_EMPTY')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })

    it('should let normal errors pass through as uncaught exceptions', () => {
      return new Promise<void>((resolve, reject) => {
        const scriptPath = path.resolve(__dirname, '../../../src/infra/console/index.ts')
        const child = spawn('npx', ['tsx', scriptPath])
        let output = ''
        let triggered = false

        child.stdout.on('data', (data) => {
          output += data.toString()
          if (output.includes('crowdfunding > ') && !triggered) {
            triggered = true
            child.stdin.write('throw new Error("Normal error")\n')
            setTimeout(() => {
              child.stdin.write('.exit\n')
            }, 300)
          }
        })

        child.stderr.on('data', (data) => {
          output += data.toString()
        })

        child.on('close', () => {
          try {
            expect(output).toContain('Error: Normal error')
            resolve()
          } catch (e) {
            reject(e)
          }
        })
      })
    })

    it('should intercept Exceptions and pass them as Result.fail to the writer (coverage)', async () => {
      const consoleApp = new Console()
      // Setup the REPL to mock it
      const mockReplServer = {
        context: {},
        eval: vi.fn((cmd, context, filename, callback) => {
          const ex = Exception.validation('EVAL_ERROR')
          callback(ex, null)
        }),
        on: vi.fn(),
        setupHistory: vi.fn((file, cb) => cb(null)),
      } as any

      vi.mocked(repl.start).mockReturnValue(mockReplServer)

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
      vi.spyOn(console, 'log').mockImplementation(() => {})

      await consoleApp.start()

      const customEval = mockReplServer.eval

      // Execute the custom eval
      const callbackSpy = vi.fn()
      customEval('cmd', {}, 'file', callbackSpy)

      // The wrapper should have converted the Exception error into a Result.fail successful result
      expect(callbackSpy).toHaveBeenCalled()
      const [err, result] = callbackSpy.mock.calls[0] as [any, any]
      expect(err).toBeNull()
      expect(ReplHelper.isResult(result)).toBe(true)
      expect((result as any).error.toSnapshot().code).toBe('EVAL_ERROR')

      // Test when it is not an exception
      mockReplServer.eval = vi.fn((cmd, context, filename, callback) => {
        callback(new Error('Normal error'), null)
      })
      await consoleApp.start()
      const customEval2 = mockReplServer.eval

      const callbackSpy2 = vi.fn()
      customEval2('cmd', {}, 'file', callbackSpy2)

      // Normal errors are passed through
      const [err2, result2] = callbackSpy2.mock.calls[0] as [any, any]
      expect(err2).toBeInstanceOf(Error)
      expect(result2).toBeNull()
    })
  })
})
