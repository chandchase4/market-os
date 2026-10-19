import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const symbols = ["BTCUSDT","ETHUSDT"]
const fmt = value => value == null || !Number.isFinite(value) ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 6 })

export default function BinancePage() {
  const [status, setStatus] = useState('connecting')
  const [ticks, setTicks] = useState({})
  const [error, setError] = useState('')
  useEffect(() => {
    const source = new EventSource('/api/binance/events')
    source.addEventListener('status', event => setStatus(JSON.parse(event.data).status))
    source.addEventListener('tick', event => {
      const tick = JSON.parse(event.data)
      setTicks(old => ({ ...old, [tick.symbol]: tick }))
    })
    source.onopen = () => setError('')
    source.onerror = () => setError('Cannot connect to backend event stream.')
    return () => source.close()
  }, [])
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M<span>●</span></div><div><strong>MarketOS</strong><small>WORKSPACE / 1.0</small></div></div>
      <div className="nav-heading">PROVIDERS</div>
      <Link to="/providers/dashboard" className="nav-link">▦ Dashboard</Link>
      <Link to="/providers/kraken" className="nav-link">◈ Kraken</Link>
      <Link to="/providers/okx" className="nav-link">◈ OKX</Link>
      <Link to="/providers/coinbase" className="nav-link">◈ Coinbase</Link>
      <Link to="/providers/binance" className="nav-link selected">◈ Binance</Link>
      <Link to="/providers/coingecko" className="nav-link">◈ CoinGecko</Link>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb"><Link to="/providers/dashboard">Providers</Link> <span>/</span> <b>Binance</b></div><div className="top-right"><span className="top-pill">READ ONLY</span></div></header>
      <div className="content">
        <div className="eyebrow">DATA MANAGER / PROVIDERS / BINANCE</div>
        <div className="heading"><div><h1>Binance Connection <span className="version">v0.1</span></h1><p>Public Binance market-data WebSocket · USDT spot pairs</p></div></div>
        <section className="stats">
          <div className="stat"><span>CONNECTION</span><strong className="provider">{status}</strong><small>Binance feed</small></div>
          <div className="stat"><span>TRACKED ASSETS</span><strong>02</strong><small>{symbols.join(' · ')}</small></div>
          <div className="stat"><span>RECEIVING DATA</span><strong>{Object.keys(ticks).length}</strong><small>Assets with quotes</small></div>
        </section>
        {error && <p role="alert">{error}</p>}
        <section className="panel">
          <div className="section-title"><div><h2>Market data</h2><p>Public Binance market-data WebSocket · USDT spot pairs</p></div><span className="section-tag">BINANCE</span></div>
          <div style={{ overflowX: 'auto', padding: 20 }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr>{['Pair', 'Last', '24h Change', '24h Volume', 'Updated'].map(h => <th key={h} style={{ padding: 12 }}>{h}</th>)}</tr></thead>
              <tbody>{symbols.map(symbol => {
                const t = ticks[symbol]
                return <tr key={symbol}>
                  <td style={{ padding: 12 }}>{symbol}</td>
                  <td style={{ padding: 12 }}>{fmt(t?.last)}</td>
                  <td style={{ padding: 12 }}>{t?.change24hPct == null ? '—' : Number(t.change24hPct).toFixed(2) + '%'}</td>
                  <td style={{ padding: 12 }}>{fmt(t?.volume24h)}</td>
                  <td style={{ padding: 12 }}>{t?.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Waiting…'}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </section>
        <footer>MARKETOS 1.0 · BINANCE PROVIDER</footer>
      </div>
    </main>
  </div>
}
