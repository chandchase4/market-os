export const coins = [{ id: 'bitcoin', symbol: 'BTC' }, { id: 'ethereum', symbol: 'ETH' }]
export class CoinGeckoFeed {
  constructor(onTick, onStatus) {
    Object.assign(this, { onTick, onStatus, stopped: false })
    this.poll()
  }
  async poll() {
    if (this.stopped) return
    this.onStatus('fetching')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      let response
      try {
        const url = new URL('https://api.coingecko.com/api/v3/coins/markets')
        url.searchParams.set('vs_currency', 'usd')
        url.searchParams.set('ids', coins.map(c => c.id).join(','))
        url.searchParams.set('price_change_percentage', '24h')
        const headers = process.env.COINGECKO_DEMO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_DEMO_API_KEY } : {}
        response = await fetch(url, { headers, signal: controller.signal })
      } finally { clearTimeout(timeout) }
      if (!response.ok) throw new Error('HTTP ' + response.status + (response.status === 429 ? ' (rate limited)' : ''))
      const rows = await response.json()
      if (!Array.isArray(rows)) throw new Error('Unexpected CoinGecko response')
      for (const item of rows) {
        this.onTick({
          symbol: item.symbol?.toUpperCase() + '-USD', last: item.current_price,
          bid: null, ask: null, volume24h: item.total_volume,
          change24hPct: item.price_change_percentage_24h,
          timestamp: item.last_updated
        })
      }
      this.onStatus('connected')
    } catch (error) {
      console.error('CoinGecko request:', error.message)
      this.onStatus('error: ' + error.message)
    } finally {
      if (!this.stopped) this.timer = setTimeout(() => this.poll(), 60000)
    }
  }
  close() { this.stopped = true; clearTimeout(this.timer) }
}
