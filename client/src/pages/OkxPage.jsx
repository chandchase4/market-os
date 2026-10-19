import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const formatPrice = value => Number.isFinite(value)
  ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'

export default function OkxPage() {
  const [status, setStatus] = useState('connecting')
  const [ticks, setTicks] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    const stream = new EventSource('/api/okx/events')
    const onStatus = event => setStatus(JSON.parse(event.data).status)
    const onTick = event => {
      const tick = JSON.parse(event.data)
      setTicks(current => ({ ...current, [tick.symbol]: tick }))
    }
    stream.addEventListener('status', onStatus)
    stream.addEventListener('tick', onTick)
    stream.onerror = () => setError('Cannot reach the OKX API event stream. Check the server.')
    stream.onopen = () => setError('')
    return () => stream.close()
  }, [])

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M<span>●</span></div><div><strong>MarketOS</strong><small>WORKSPACE / 1.0</small></div></div>
      <div className="nav-heading">PROVIDERS</div>
      <Link to="/providers/dashboard" className="nav-link"><span className="nav-icon">▦</span> Dashboard</Link>
      <Link to="/providers/kraken" className="nav-link"><span className="nav-icon">◈</span> Kraken</Link>
      <Link to="/providers/okx" className="nav-link selected"><span className="nav-icon">◈</span> OKX</Link>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb"><Link to="/providers/dashboard">Providers</Link> <span>/</span> <b>OKX</b></div><div className="top-right"><span className="top-pill">WEBSOCKET / PUBLIC</span></div></header>
      <div className="content">
        <div className="eyebrow">DATA MANAGER / PROVIDERS / OKX</div>
        <div className="heading"><div><h1>OKX Connection <span className="version">v0.1</span></h1><p>Public OKX WebSocket ticker feed. Read-only connection test; no scanner CRUD yet.</p></div></div>
        <section className="stats">
          <div className="stat"><span>CONNECTION</span><strong className="provider">{status}</strong><small>OKX public WebSocket</small></div>
          <div className="stat"><span>SUBSCRIBED PAIRS</span><strong>02</strong><small>BTC-USDT, ETH-USDT</small></div>
          <div className="stat"><span>PAIRS RECEIVING DATA</span><strong>{Object.keys(ticks).length}</strong><small>Since opening this page</small></div>
        </section>
        {error && <p role="alert" style={{ color: '#ff9a9a' }}>{error}</p>}
        <section className="panel">
          <div className="section-title"><div><h2>Live ticker data</h2><p>Prices update as OKX publishes ticker events.</p></div><span className="section-tag">OKX / TICKERS</span></div>
          <div style={{ overflowX: 'auto', padding: '0 20px 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead><tr>{['Pair', 'Last', '24h Change', 'Bid', 'Ask', 'Updated'].map(h => <th key={h} style={{ padding: 12, borderBottom: '1px solid #293848' }}>{h}</th>)}</tr></thead>
              <tbody>{['BTC-USDT', 'ETH-USDT'].map(symbol => {
                const t = ticks[symbol]
                return <tr key={symbol}>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140' }}>{symbol}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140' }}>{formatPrice(t?.last)}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140', color: t?.change24hPct >= 0 ? '#6ce0b7' : '#f68b93' }}>{t?.change24hPct == null ? '—' : t.change24hPct.toFixed(2) + '%'}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140' }}>{formatPrice(t?.bid)}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140' }}>{formatPrice(t?.ask)}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #243140' }}>{t?.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Waiting…'}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        </section>
        <footer>MARKETOS 1.0 <span>·</span> OKX PROVIDER</footer>
      </div>
    </main>
  </div>
}
