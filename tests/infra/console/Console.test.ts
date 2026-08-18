import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const SCRIPT = path.resolve(__dirname, '../../../src/infra/console/index.ts')
const HISTORY_PATH = path.resolve(__dirname, '../../../.console_history')

/**
 * Spawns the console process, waits for the prompt, sends each command,
 * then exits after a short delay. Returns the combined stdout + stderr output.
 */
function runSession(commands: string[], delayMs = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', SCRIPT])
    let output = ''
    let ready = false

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString()

      if (!ready && output.includes('crowdfunding > ')) {
        ready = true
        for (const cmd of commands) child.stdin.write(`${cmd}\n`)
        setTimeout(() => child.stdin.write('.exit\n'), delayMs)
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      output += data.toString()
    })

    child.on('close', () => resolve(output))
    child.on('error', reject)
  })
}

describe('Console', () => {
  describe('lifecycle', () => {
    it('should display the prompt on startup and print "Goodbye." on exit', async () => {
      const output = await runSession([])

      expect(output).toContain('crowdfunding > ')
      expect(output).toContain('Goodbye.')
    })

    it('should populate the REPL context with all domain classes, repositories, and use cases', async () => {
      const output = await runSession([
        'Object.keys(global).filter(k => k !== "global").join(", ")',
      ])

      // Values
      expect(output).toContain('Email')
      expect(output).toContain('Exception')
      expect(output).toContain('Result')
      // Entities
      expect(output).toContain('Campaign')
      expect(output).toContain('Donation')
      expect(output).toContain('Supporter')
      expect(output).toContain('Tier')
      // Repositories
      expect(output).toContain('CampaignRepositoryInMemory')
      expect(output).toContain('SupporterRepositoryInMemory')
      // Use Cases
      expect(output).toContain('CreateCampaignUseCase')
      expect(output).toContain('CreateSupporterUseCase')
      expect(output).toContain('MakeDonationUseCase')
    })

    it('should persist commands across sessions via history recall', async () => {
      const marker = `const hist_marker_${Math.floor(Math.random() * 1e6)} = ${Math.random()}`

      // Session 1 — write the marker command
      await new Promise<void>((resolve, reject) => {
        const child = spawn('npx', ['tsx', SCRIPT])
        let out = ''
        let triggered = false

        child.stdout.on('data', (data: Buffer) => {
          out += data.toString()

          if (!triggered && out.includes('crowdfunding > ')) {
            triggered = true
            child.stdin.write(`${marker}\n`)
            setTimeout(() => child.stdin.write('.exit\n'), 300)
          }
        })

        child.on('close', resolve)
        child.on('error', reject)
      })

      // Session 2 — recall via UP arrow and check output contains the marker
      const out2 = await new Promise<string>((resolve, reject) => {
        const child = spawn('npx', ['tsx', SCRIPT])
        let output = ''
        let triggered = false

        child.stdout.on('data', (data: Buffer) => {
          output += data.toString()

          if (!triggered && output.includes('crowdfunding > ')) {
            triggered = true
            child.stdin.write('\x1B[A\n') // UP arrow
            setTimeout(() => child.stdin.write('.exit\n'), 300)
          }
        })

        child.on('close', () => resolve(output))
        child.on('error', reject)
      })

      expect(out2).toContain(marker)
    }, 15000)

    it('should log an error to stderr when the history file cannot be opened', async () => {
      // Make the history path a directory so Node cannot open it as a file
      if (fs.existsSync(HISTORY_PATH)) fs.rmSync(HISTORY_PATH, { recursive: true, force: true })
      fs.mkdirSync(HISTORY_PATH)

      const output = await runSession([], 300)

      // Node.js REPL itself emits this message when setupHistory fails
      expect(output).toContain('Could not open history file')
    }, 15000)

    afterEach(() => {
      // Restore history path to a file if the error test left a directory
      if (fs.existsSync(HISTORY_PATH) && fs.statSync(HISTORY_PATH).isDirectory()) {
        fs.rmSync(HISTORY_PATH, { recursive: true, force: true })
      }
    })
  })

  describe('auto-unwrap and output formatting', () => {
    it('should display the domain object when a successful Result is auto-unwrapped', async () => {
      const output = await runSession(['const c = Campaign.make(Name.make("My Campaign"))', 'c'])

      expect(output).toContain('Campaign {')
      expect(output).toContain('My Campaign')
      expect(output).toContain('CampaignFunding {')
    })

    it('should display a formatted domain exception when a failed Result is auto-unwrapped', async () => {
      const output = await runSession(['Name.make("")'])

      // The REPL interceptor converts the thrown Exception into a Result.fail
      // and the writer formats it with group and code
      expect(output).toContain('Validation')
      expect(output).toContain('NAME_EMPTY')
    })

    it('should let ordinary JavaScript errors pass through as uncaught exceptions', async () => {
      const output = await runSession(['throw new Error("boom")'])

      expect(output).toContain('Error: boom')
    })
  })
})
