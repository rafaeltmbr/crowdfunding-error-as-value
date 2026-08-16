import * as repl from 'node:repl'

export class Console {
  private replServer!: repl.REPLServer

  public async start(): Promise<void> {
    this.setupRepl()
    this.setupGracefulShutdown()
  }

  private setupRepl(): void {
    this.replServer = repl.start({
      prompt: 'crowdfunding > ',
      useColors: true,
    })
  }

  private setupGracefulShutdown(): void {
    this.replServer.on('exit', () => {
      console.log('Goodbye.')
      process.exit(0)
    })
  }
}
