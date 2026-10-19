import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const symbols = ['BTC-USD', 'ETH-USD']
const fmt = value => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: 6 })

export default function CoinbasePage() {
  const [status, setStatus] = useState('connecting')
  const [ticks, setTicks] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    const stream = new EventSource('/api/coinbase/events')
    stream.addEventListener('status', event => setStatus(JSON.parse(event.data).status))
    stream.addEventListener('tick', event => {
      const tick = JSON.parse(event.data)
      setTicks(previous => ({ ...previous, [tick.symbol]: tick }))
    })
    stream.onopen = () => setError('')
    stream.onerror = () => setError('Backend event stream unavailable. Check the server.')
    return () => stream.close()
  }, [])

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M<span>●</span></div><div><strong>MarketOS</strong><small>WORKSPACE / 1.0</small></div></div>
      <div className="nav-heading">PROVIDERS</div>
      <Link to="/providers/dashboard" className="nav-link">▦ Dashboard</Link>
      <Link to="/providers/kraken" className="nav-link">◈ Kraken</Link>
      <Link to="/providers/okx" className="nav-link">◈ OKX</Link>
      <Link to="/providers/coinbase" className="nav-link selected">◈ Coinbase</Link>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb"><Link to="/providers/dashboard">Providers</Link> <span>/</span> <b>Coinbase</b></div><div className="top-right"><span className="top-pill">PUBLIC WEBSOCKET</span></div></header>
      <div className="content">
        <div className="eyebrow">DATA MANAGER / PROVIDERS / COINBASE</div>
        <div className="heading"><div><h1>Coinbase Connection <span className="version">v0.1</span></h1><p>Live read-only Coinbase Exchange ticker feed.</p></div></div>
        <section className="stats">
          <div className="stat"><span>CONNECTION</span><strong className="provider">{status}</strong><small>Coinbase WebSocket</small></div>
          <div className="stat"><span>SUBSCRIBED PAIRS</span><strong>02</strong><small>BTC-USD · ETH-USD</small></div>
          <div className="stat"><span>PAIRS RECEIVING DATA</span><strong>{Object.keys(ticks).length}</strong><small>Live ticker updates</small></div>
        </section>
        {error && <p role="alert">{error}</p>}
        <section className="panel">
          <div className="section-title"><div><h2>Live ticker data</h2><p>Prices update as Coinbase publishes ticker events.</p></div><span className="section-tag">COINBASE</span></div>
          <div style={{ overflowX: 'auto', padding: 20 }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr>{['Pair', 'Last', '24h Change', 'Bid', 'Ask', 'Updated'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}</tr></thead>
              <tbody>{symbols.map(symbol => {
                const t = ticks[symbol]
                return <tr key={symbol}>
                  <td style={{ padding: 12 }}>{symbol}</td>
                  <td style={{ padding: 12 }}>{fmt(t?.last)}</td>
                  <td style={{ padding: 12 }}>{t?.change24hPct == null ? '—' : t.change24hPct.toFixed(2) + '%'}</td>
                  <td style={{ padding: 12 }}>{fmt(t?.bid)}</td>
                  <td style={{ padding: 12 }}>{fmt(t?.ask)}</td>
                  <td style={{ padding: 12 }}>{t?.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Waiting…'}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </section>
        <footer>MARKETOS 1.0 · COINBASE PROVIDER</footer>
      </div>
    </main>
  </div>
}
