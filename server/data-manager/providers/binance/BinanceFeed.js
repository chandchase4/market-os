import WebSocket from 'ws'
export const symbols = ['BTCUSDT', 'ETHUSDT']
export class BinanceFeed {
  constructor(onTick, onStatus) {
    Object.assign(this, { onTick, onStatus, stopped: false, attempt: 0 })
    this.connect()
  }
  connect() {
    if (this.stopped) return
    this.onStatus('connecting')
    const socket = new WebSocket('wss://data-stream.binance.vision/stream?streams=btcusdt@ticker/ethusdt@ticker')
    this.socket = socket
    socket.on('open', () => { this.attempt = 0; this.onStatus('connected') })
    socket.on('message', raw => {
      try {
        const packet = JSON.parse(raw.toString())
        const m = packet.data
        if (!m || m.e !== '24hrTicker' || !symbols.includes(m.s)) return
        this.onTick({
          symbol: m.s, last: Number(m.c), bid: Number(m.b), ask: Number(m.a),
          volume24h: Number(m.v), change24hPct: Number(m.P),
          timestamp: new Date(m.E).toISOString()
        })
      } catch (error) { console.error('Binance message:', error.message) }
    })
    socket.on('error', error => console.error('Binance socket:', error.message))
    socket.on('close', () => {
      if (this.stopped) return
      this.onStatus('disconnected')
      this.timer = setTimeout(() => this.connect(), Math.min(1000 * 2 ** this.attempt++, 30000))
    })
  }
  close() { this.stopped = true; clearTimeout(this.timer); this.socket?.close() }
}
