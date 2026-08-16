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
  })

  describe('setupRepl eval override', () => {
    it('should intercept Exceptions and pass them as Result.fail to the writer', async () => {
      const consoleApp = new Console()
      // Setup the REPL to mock it
      const mockReplServer = {
        context: {},
        eval: vi.fn((cmd, context, filename, callback) => {
          const ex = Exception.validation('EVAL_ERROR')
          callback(ex, null)
        }),
        on: vi.fn(),
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

      vi.restoreAllMocks()
    })
  })
})
