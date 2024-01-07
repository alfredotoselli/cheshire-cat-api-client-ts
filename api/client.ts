import WebSocket from 'isomorphic-ws'
import { CCatAPI } from './CCatAPI'
import { 
    SocketResponse, SocketError, 
    WebSocketState, WebSocketSettings,
    isMessageResponse, CatSettings,
} from './utils'

/**
 * The class to communicate with the Cheshire Cat AI
 */
export class CatClient {
    private config!: CatSettings
    private apiClient: CCatAPI | undefined
    private ws: WebSocket | undefined
    private connectedHandler?: () => void
    private disconnectedHandler?: () => void
    private messageHandler?: (data: SocketResponse) => void
    private errorHandler?: (error: SocketError, event?: WebSocket.ErrorEvent) => void
    private explicitlyClosed = false
    private retried = 0
    
    /**
     * Initialize the class with the specified settings
     * @param settings The settings to pass
     */
    constructor(settings: CatSettings) {
        this.config = {
            secure: false,
            instant: true,
            timeout: 10000,
            port: 1865,
            user: 'user',
            ...settings
        }
        if (this.config.instant) this.init()
    }

    private initWebSocket() {
        const socketSettings = this.config.ws = {
            delay: 3000,
            path: 'ws',
            retries: 3,
            ...this.config.ws
        } satisfies WebSocketSettings
        const user = this.config.user ?? 'user'
        this.ws = new WebSocket(`ws${this.protocol}/${socketSettings.path}/${user}`)
        this.ws.onopen = () => {
            this.connectedHandler?.()
        }
        this.ws.onclose = () => {
            if (!this.explicitlyClosed) {
                this.retried += 1
                if (socketSettings.retries < 0 || this.retried < socketSettings.retries) {
                    setTimeout(() => this.initWebSocket(), socketSettings.delay)
                } else socketSettings.onFailed?.({
                    name: 'FailedRetry',
                    description: `Failed to connect WebSocket after ${socketSettings.retries} retries.`
                })
            }
            this.disconnectedHandler?.()
        }
        this.ws.onmessage = (event) => {
            if (typeof event.data != 'string') return
            const data = JSON.parse(event.data) as SocketError | SocketResponse
            if (isMessageResponse(data)) {
                this.messageHandler?.(data)
                return
            }
            this.errorHandler?.(data)
        }
        this.ws.onerror = (event) => {
            this.errorHandler?.({
                name: 'WebSocketConnectionError',
                description: 'Something went wrong while connecting to the server'
            }, event)
        }
    }

    /**
     * Resets the current `CatClient` instance.
     * @returns The updated `CatClient` instance.
     */
    reset(): CatClient {
        this.retried = 0
        this.close()
        this.ws = undefined
        this.apiClient = undefined
        return this
    }

    /**
     * Initialize the WebSocket and the API Client
     * @returns The current `CatClient` class instance
     */
    init(): CatClient {
        if (!this.ws && !this.apiClient) {
            this.initWebSocket()
            this.apiClient = new CCatAPI({
                BASE: `http${this.protocol}`,
                HEADERS: {
                    'access_token': this.config.authKey ?? '',
                    'user_id': this.config.user ?? 'user'
                }
            })
        }
        return this
    }

    /**
     * Sends a message to the Cat through the WebSocket connection.
     * @param message The message to send to the Cat.
     * @param data The custom data to send to the Cat.
     * @param userId The ID of the user sending the message. Defaults to "user".
     * @returns The `CatClient` instance.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send(message: string, data?: Record<string, any>, userId?: string): CatClient {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            this.errorHandler?.({
                name: 'SocketClosed',
                description: 'The connection to the server was closed'
            })
            return this
        }
        if (data && ('text' in data || 'user_id' in data)) {
            throw new Error('The data object should not have a "text" or a "user_id" property')
        }
        const jsonMessage = JSON.stringify({ 
            text: message,
            user_id: userId ?? (this.config.user ?? 'user'),
            ...data
        })
        this.ws.send(jsonMessage)
        return this
    }

    /**
     * @returns The API Client
     */
    get api(): CCatAPI | undefined {
        return this.apiClient
    }
    
    /**
     * Setter for the authentication key used by the client. This will also reset the client.
     * @param key The authentication key to be set.
     */
    set authKey(key: string) {
        this.config.authKey = key
        this.reset().init()
    }

    /**
     * Setter for the user ID used by the client. This will also reset the client.
     * @param user The user ID to be set.
     */
    set userId(user: string) {
        this.config.user = user
        this.reset().init()
    }

    /**
     * Closes the WebSocket connection.
     * @returns The `CatClient` instance.
     */
    close(): CatClient {
        this.ws?.close()
        this.explicitlyClosed = true
        return this
    }

    /**
     * Returns the current state of the WebSocket connection.
     * @returns The WebSocketState enum value representing the current state of the WebSocket connection.
     */
    readyState(): WebSocketState {
        return this.ws?.readyState ?? WebSocketState.CLOSED
    }

    /**
     * Calls the handler when the WebSocket is connected 
     * @param handler The function to call
     * @returns The current `CatClient` class instance
     */
    onConnected(handler: () => void): CatClient {
        this.connectedHandler = handler
        return this
    }

    /**
     * Calls the handler when the WebSocket is disconnected
     * @param handler The function to call
     * @returns The current `CatClient` class instance
     */
    onDisconnected(handler: () => void): CatClient {
        this.disconnectedHandler = handler
        return this
    }

    /**
     * Calls the handler when a new message arrives from the WebSocket
     * @param handler The function to call
     * @returns The current `CatClient` class instance
     */
    onMessage(handler: (data: SocketResponse) => void): CatClient {
        this.messageHandler = handler
        return this
    }

    /**
     * Calls the handler when the WebSocket catches an exception
     * @param handler The function to call
     * @returns The current `CatClient` class instance
     */
    onError(handler: (error: SocketError, event?: WebSocket.ErrorEvent) => void): CatClient {
        this.errorHandler = handler
        return this
    }
    
    private get protocol() {
        return `${this.config.secure ? 's' : ''}://
            ${this.config.baseUrl}
            ${this.config.port ? `:${this.config.port}` : ''}
            `.replace(/\s/g, '')
    }
}