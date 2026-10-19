import WebSocket from 'ws'

const ENDPOINT = 'wss://ws.okx.com:8443/ws/v5/public'
const DEFAULT_SYMBOLS = ['BTC-USDT', 'ETH-USDT']

export class OkxFeed {
  constructor(onTick, onStatus) {
    this.onTick = onTick
    this.onStatus = onStatus
    this.symbols = DEFAULT_SYMBOLS
    this.stopped = false
    this.attempt = 0
    this.connect()
  }

  connect() {
    if (this.stopped) return
    this.onStatus('connecting')
    const ws = new WebSocket(ENDPOINT)
    this.ws = ws
    ws.on('open', () => {
      if (this.ws !== ws) return
      this.attempt = 0
      this.onStatus('connected')
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: this.symbols.map(instId => ({ channel: 'tickers', instId }))
      }))
      this.heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 20000)
    })
    ws.on('message', raw => {
      const body = raw.toString()
      if (body === 'pong') return
      try {
        const message = JSON.parse(body)
        if (message.event === 'error') {
          console.error('OKX subscription error:', message.msg)
          this.onStatus('error: ' + (message.msg || 'subscription rejected'))
        }
        if (message.arg?.channel === 'tickers' && Array.isArray(message.data)) {
          for (const item of message.data) {
            this.onTick({
              symbol: item.instId,
              last: Number(item.last),
              bid: Number(item.bidPx),
              ask: Number(item.askPx),
              volume24h: Number(item.vol24h),
              change24hPct: Number(item.open24h) > 0
                ? (Number(item.last) / Number(item.open24h) - 1) * 100 : null,
              timestamp: Number(item.ts)
            })
          }
        }
      } catch (error) {
        console.error('OKX message parse error:', error.message)
      }
    })
    ws.on('error', error => console.error('OKX WebSocket:', error.message))
    ws.on('close', () => {
      clearInterval(this.heartbeat)
      if (this.stopped || this.ws !== ws) return
      this.onStatus('disconnected')
      const delay = Math.min(1000 * 2 ** this.attempt++, 30000)
      this.retryTimer = setTimeout(() => this.connect(), delay)
    })
  }

  close() {
    this.stopped = true
    clearInterval(this.heartbeat)
    clearTimeout(this.retryTimer)
    this.ws?.close()
  }
}
