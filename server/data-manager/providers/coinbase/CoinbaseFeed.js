import WebSocket from 'ws'

export const products = ['BTC-USD', 'ETH-USD']

export class CoinbaseFeed {
  constructor(onTick, onStatus) {
    this.onTick = onTick
    this.onStatus = onStatus
    this.stopped = false
    this.attempt = 0
    this.connect()
  }

  connect() {
    if (this.stopped) return
    this.onStatus('connecting')
    const socket = new WebSocket('wss://ws-feed.exchange.coinbase.com')
    this.socket = socket
    socket.on('open', () => {
      this.attempt = 0
      this.onStatus('connected')
      socket.send(JSON.stringify({ type: 'subscribe', product_ids: products, channels: ['ticker', 'heartbeat'] }))
    })
    socket.on('message', raw => {
      try {
        const m = JSON.parse(raw.toString())
        if (m.type === 'error') { this.onStatus('error: ' + m.message); return }
        if (m.type !== 'ticker' || !products.includes(m.product_id)) return
        const last = Number(m.price)
        if (!Number.isFinite(last)) return
        this.onTick({
          symbol: m.product_id,
          last,
          bid: m.best_bid ? Number(m.best_bid) : null,
          ask: m.best_ask ? Number(m.best_ask) : null,
          volume24h: m.volume_24h ? Number(m.volume_24h) : null,
          change24hPct: Number(m.open_24h) > 0 ? (last / Number(m.open_24h) - 1) * 100 : null,
          timestamp: m.time || new Date().toISOString()
        })
      } catch (error) { console.error('Coinbase message:', error.message) }
    })
    socket.on('error', error => console.error('Coinbase socket:', error.message))
    socket.on('close', () => {
      if (this.stopped) return
      this.onStatus('disconnected')
      this.timer = setTimeout(() => this.connect(), Math.min(1000 * 2 ** this.attempt++, 30000))
    })
  }

  close() {
    this.stopped = true
    clearTimeout(this.timer)
    this.socket?.close()
  }
}
