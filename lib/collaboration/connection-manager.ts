import * as signalR from "@microsoft/signalr"
import type { ConnectionStatus } from "@/types/collaboration"

export type ConnectionManagerConfig = {
  hubUrl: string
  token: string
  onStatusChange: (status: ConnectionStatus) => void
  onTokenRefresh: () => Promise<string>
}

export class ConnectionManager {
  private connection: signalR.HubConnection | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private status: ConnectionStatus = "disconnected"
  private currentNoteId: string | null = null
  private currentToken: string

  constructor(private config: ConnectionManagerConfig) {
    this.currentToken = config.token
  }

  /** Establish connection, join document room */
  async connect(noteId: string): Promise<void> {
    this.currentNoteId = noteId
    this.setStatus("connecting")

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.config.hubUrl, {
          accessTokenFactory: () => this.currentToken,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null
            }
            const delay = Math.min(
              1000 * Math.pow(2, retryContext.previousRetryCount),
              30000
            )
            return delay
          },
        })
        .build()

      this.setupConnectionCallbacks()

      await this.connection.start()
      await this.connection.invoke("JoinDocument", { noteId })

      this.reconnectAttempts = 0
      this.setStatus("connected")
    } catch (error) {
      this.setStatus("disconnected")
      throw error
    }
  }

  /** Leave room and close connection */
  async disconnect(): Promise<void> {
    if (!this.connection) return

    try {
      if (this.connection.state === signalR.HubConnectionState.Connected && this.currentNoteId) {
        await this.connection.invoke("LeaveDocument", { noteId: this.currentNoteId })
      }
      await this.connection.stop()
    } catch {
      // Best effort disconnect
    } finally {
      this.connection = null
      this.currentNoteId = null
      this.setStatus("disconnected")
    }
  }

  /** Manual reconnect trigger — reconnects to the same document */
  async reconnect(): Promise<void> {
    const noteId = this.currentNoteId
    if (!noteId) return

    // Stop existing connection if present
    if (this.connection) {
      try {
        await this.connection.stop()
      } catch {
        // Ignore stop errors during manual reconnect
      }
      this.connection = null
    }

    this.reconnectAttempts = 0

    // Refresh token before reconnecting
    try {
      this.currentToken = await this.config.onTokenRefresh()
    } catch {
      // Use existing token if refresh fails
    }

    await this.connect(noteId)
  }

  /** Get underlying HubConnection for provider binding */
  getConnection(): signalR.HubConnection | null {
    return this.connection
  }

  /** Current connection status */
  getStatus(): ConnectionStatus {
    return this.status
  }

  private setupConnectionCallbacks(): void {
    if (!this.connection) return

    this.connection.onreconnecting(() => {
      this.reconnectAttempts++
      this.setStatus("reconnecting")
    })

    this.connection.onreconnected(async () => {
      this.reconnectAttempts = 0

      // Refresh token on successful reconnect
      try {
        this.currentToken = await this.config.onTokenRefresh()
      } catch {
        // Continue with existing token
      }

      // Rejoin the document room after reconnection
      if (this.currentNoteId && this.connection) {
        try {
          await this.connection.invoke("JoinDocument", { noteId: this.currentNoteId })
        } catch {
          // If rejoin fails, the provider will handle sync issues
        }
      }

      this.setStatus("connected")
    })

    this.connection.onclose(() => {
      this.setStatus("disconnected")
    })
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.config.onStatusChange(status)
  }
}
