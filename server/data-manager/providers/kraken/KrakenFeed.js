import WebSocket from 'ws'

const ENDPOINT = 'wss://ws.kraken.com/v2'

export class KrakenFeed {
  constructor(onTick, onStatus) {
    this.onTick = onTick
    this.onStatus = onStatus
    this.symbols = new Set()
    this.subscribed = new Set()
    this.stopped = false
    this.retry = 0
    this.connect()
  }

  connect() {
    if (this.stopped) return
    this.onStatus('connecting')
    const ws = new WebSocket(ENDPOINT)
    this.ws = ws
    ws.on('open', () => {
      if (this.ws !== ws) return
      this.retry = 0
      this.subscribed.clear()
      this.onStatus('connected')
      this.send('subscribe', [...this.symbols])
    })
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.channel === 'ticker' && Array.isArray(msg.data)) {
          for (const tick of msg.data) this.onTick(tick)
        }
        if (msg.method === 'subscribe' && msg.success === false) {
          console.warn('Kraken rejected subscription:', msg.error, msg.result?.symbol)
          this.onStatus('subscription error: ' + (msg.error || 'unknown symbol'))
        }
      } catch (err) { console.error('Kraken message error:', err.message) }
    })
    ws.on('error', (err) => console.error('Kraken connection:', err.message))
    ws.on('close', () => {
      if (this.ws !== ws || this.stopped) return
      this.onStatus('disconnected')
      const delay = Math.min(1000 * 2 ** this.retry++, 30000)
      this.timer = setTimeout(() => this.connect(), delay)
    })
  }

  send(method, symbols) {
    if (!symbols.length || this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      method,
      params: { channel: 'ticker', symbol: symbols, ...(method === 'subscribe' ? { event_trigger: 'trades', snapshot: true } : {}) }
    }))
  }

  setSymbols(symbols) {
    const next = new Set(symbols)
    const removed = [...this.symbols].filter(x => !next.has(x))
    const added = [...next].filter(x => !this.symbols.has(x))
    this.symbols = next
    this.send('unsubscribe', removed)
    this.send('subscribe', added)
  }

  close() {
    this.stopped = true
    clearTimeout(this.timer)
    this.ws?.close()
  }
}
