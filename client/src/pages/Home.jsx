import { useEffect, useMemo, useState } from 'react'
import './Home.css'

const initial = { kraken: 'connecting', okx: 'connecting' }
const normalize = (provider, tick) => ({
  id: provider + ':' + tick.symbol,
  provider,
  symbol: tick.symbol,
  price: Number(provider === 'kraken' ? tick.last : tick.last),
  change: provider === 'kraken'
    ? (Number.isFinite(Number(tick.change_pct)) ? Number(tick.change_pct) : null)
    : tick.change24hPct,
  volume: provider === 'kraken' ? Number(tick.volume) : tick.volume24h,
  receivedAt: tick.receivedAt || (tick.timestamp ? new Date(tick.timestamp).toISOString() : new Date().toISOString())
})
const number = (value, digits = 2) => Number.isFinite(value)
  ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—'

async function api(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Request failed (' + response.status + ')')
  }
  return response.status === 204 ? null : response.json()
}

export default function Home() {
  const [items, setItems] = useState([])
  const [ticks, setTicks] = useState({})
  const [statuses, setStatuses] = useState(initial)
  const [symbol, setSymbol] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('symbol')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    api('/api/kraken/items').then(data => { if (mounted) setItems(data) }).catch(e => { if (mounted) setError(e.message) })
    api('/api/okx/status').then(data => {
      if (!mounted) return
      setStatuses(prev => ({ ...prev, okx: data.status }))
      setTicks(prev => {
        const next = { ...prev }
        for (const tick of data.ticks || []) {
          const row = normalize('okx', tick)
          next[row.id] = row
        }
        return next
      })
    }).catch(e => { if (mounted) setError(e.message) })

    const streams = ['kraken', 'okx'].map(provider => {
      const stream = new EventSource('/api/' + provider + '/events')
      stream.addEventListener('tick', event => {
        if (!mounted) return
        const row = normalize(provider, JSON.parse(event.data))
        setTicks(prev => ({ ...prev, [row.id]: row }))
      })
      stream.addEventListener('status', event => {
        if (mounted) setStatuses(prev => ({ ...prev, [provider]: JSON.parse(event.data).status }))
      })
      if (provider === 'kraken') stream.addEventListener('items', event => {
        if (mounted) setItems(JSON.parse(event.data))
      })
      stream.onerror = () => {
        if (mounted) setStatuses(prev => ({ ...prev, [provider]: 'reconnecting' }))
      }
      return stream
    })
    return () => { mounted = false; streams.forEach(stream => stream.close()) }
  }, [])

  const rows = useMemo(() => {
    const kraken = items.filter(item => item.enabled).map(item => {
      const live = ticks['kraken:' + item.symbol]
      return live || { id: 'kraken:' + item.symbol, provider: 'kraken', symbol: item.symbol, price: null, change: null, volume: null }
    })
    const okx = ['BTC-USDT', 'ETH-USDT'].map(pair =>
      ticks['okx:' + pair] || { id: 'okx:' + pair, provider: 'okx', symbol: pair, price: null, change: null, volume: null }
    )
    const needle = filter.trim().toLowerCase()
    return [...kraken, ...okx]
      .filter(row => (row.symbol + ' ' + row.provider).toLowerCase().includes(needle))
      .sort((a, b) => sort === 'symbol'
        ? a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider)
        : sort === 'provider'
          ? a.provider.localeCompare(b.provider) || a.symbol.localeCompare(b.symbol)
          : (Number.isFinite(b[sort]) ? b[sort] : -Infinity) - (Number.isFinite(a[sort]) ? a[sort] : -Infinity))
  }, [items, ticks, filter, sort])

  async function addPair(event) {
    event.preventDefault()
    if (!symbol.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await api('/api/kraken/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() })
      })
      setItems(await api('/api/kraken/items'))
      setSymbol('')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function removePair(id) {
    setError('')
    try {
      await api('/api/kraken/items/' + id, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item._id !== id))
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="scanner">
      <header className="topbar">
        <div><span className="eyebrow">MARKETOS 1.0 · MVP</span><h1>Live Scanner</h1><p>Kraken + OKX market data</p></div>
        <div className="statuses">
          {Object.entries(statuses).map(([provider, status]) => (
            <span className="status" key={provider}><i className={status === 'connected' ? 'online' : ''} />{provider.toUpperCase()} · {status}</span>
          ))}
        </div>
      </header>

      <section className="controls">
        <form onSubmit={addPair} className="add-form">
          <label htmlFor="symbol">Add Kraken pair</label>
          <div className="inline"><input id="symbol" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="SOL/USD" aria-label="Kraken trading pair" /><button disabled={busy || !symbol.trim()}>{busy ? 'Adding…' : 'Add pair'}</button></div>
        </form>
        <div className="control"><label htmlFor="filter">Search</label><input id="filter" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Symbol or provider" /></div>
        <div className="control"><label htmlFor="sort">Sort by</label><select id="sort" value={sort} onChange={e => setSort(e.target.value)}><option value="symbol">Symbol</option><option value="provider">Provider</option><option value="price">Price ↓</option><option value="change">24h change ↓</option><option value="volume">24h volume ↓</option></select></div>
      </section>

      {error && <p role="alert" className="error">{error}</p>}
      <section className="table-panel">
        <div className="table-heading"><h2>Markets</h2><span>{rows.length} rows · Live via SSE</span></div>
        <div className="table-scroll"><table><thead><tr><th>Market</th><th>Provider</th><th className="numeric">Last price</th><th className="numeric">24h change</th><th className="numeric">24h volume (base)</th><th></th></tr></thead>
          <tbody>{rows.map(row => {
            const item = row.provider === 'kraken' ? items.find(x => x.symbol === row.symbol) : null
            return <tr key={row.id}><td className="pair">{row.symbol}</td><td><span className="provider">{row.provider.toUpperCase()}</span></td><td className="numeric">{number(row.price, 8)}</td><td className={'numeric ' + (row.change > 0 ? 'positive' : row.change < 0 ? 'negative' : '')}>{row.change == null || !Number.isFinite(row.change) ? '—' : (row.change > 0 ? '+' : '') + number(row.change) + '%'}</td><td className="numeric">{number(row.volume)}</td><td className="action">{item && <button className="remove" onClick={() => removePair(item._id)} aria-label={'Remove ' + row.symbol}>Remove</button>}</td></tr>
          })}</tbody>
        </table>{rows.length === 0 && <p className="empty">No matching markets. Add a Kraken pair to start.</p>}</div>
      </section>
      <p className="footnote">OKX tracks BTC-USDT and ETH-USDT in this MVP. Kraken pairs are saved in MongoDB. Live values may take a moment to arrive.</p>
    </main>
  )
}
