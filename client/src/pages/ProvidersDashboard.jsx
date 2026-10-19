import { Link } from 'react-router-dom'
import '../App.css'

const providers = [
  { name: 'Kraken', description: 'Live spot-market WebSocket scanner and pair management.', path: '/providers/kraken', status: 'Available', initials: 'K' },
  { name: 'Coinbase', description: 'Future market-data integration.', status: 'Planned', initials: 'C' },
  { name: 'Binance', description: 'Future market-data integration.', status: 'Planned', initials: 'B' },
  { name: 'OKX', description: 'Public WebSocket ticker connection with live BTC and ETH prices.', path: '/providers/okx', status: 'Available', initials: 'O' },
  { name: 'CoinGecko', description: 'Future market-data integration.', status: 'Planned', initials: 'G' }
]

export default function ProvidersDashboard() {
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">M<span>●</span></div><div><strong>MarketOS</strong><small>WORKSPACE / 1.0</small></div></div>
      <div className="nav-heading">WORKSPACE</div>
      <Link to="/providers/dashboard" className="nav-link selected"><span className="nav-icon">▦</span> Providers</Link>
      <Link to="/providers/kraken" className="nav-link"><span className="nav-icon">◈</span> Kraken Scanner</Link>
      <Link to="/providers/okx" className="nav-link"><span className="nav-icon">◈</span> OKX Connection</Link>
      <div className="sidebar-bottom"><span className="dot" /> PROVIDER HUB <small>MarketOS Data Manager</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Providers</b></div><div className="top-right"><span className="top-pill">DATA MANAGER</span><span className="avatar">M</span></div></header>
      <div className="content">
        <div className="eyebrow">DATA MANAGER / PROVIDERS</div>
        <div className="heading"><div><h1>Provider Dashboard <span className="version">v0.1</span></h1><p>Manage your market-data connections. Select a provider to open its workspace.</p></div></div>
        <section className="stats">
          <div className="stat"><span>PROVIDERS</span><strong>05</strong><small>Listed integrations</small></div>
          <div className="stat"><span>AVAILABLE</span><strong>02</strong><small>Kraken and OKX</small></div>
          <div className="stat"><span>PLANNED</span><strong>03</strong><small>Future integrations</small></div>
          <div className="stat"><span>ACTIVE PROVIDER</span><strong className="provider">Kraken</strong><small>Spot · WebSocket v2</small></div>
        </section>
        <section className="panel">
          <div className="section-title"><div><h2>Market data providers</h2><p>Kraken and OKX have provider pages. Coinbase, Binance, and CoinGecko remain placeholders.</p></div><span className="section-tag">DIRECTORY</span></div>
          <div className="provider-grid">
            {providers.map(provider => <div className="provider-card" key={provider.name}>
              <div className="provider-icon">{provider.initials}</div>
              <div className="provider-card-content"><div className="provider-card-title"><h3>{provider.name}</h3><span className={provider.path ? 'provider-state ready' : 'provider-state'}>{provider.status}</span></div><p>{provider.description}</p></div>
              {provider.path ? <Link className="provider-open" to={provider.path}>Open provider →</Link> : <span className="provider-unavailable">Coming later</span>}
            </div>)}
          </div>
        </section>
        <footer>MARKETOS 1.0 <span>·</span> DATA MANAGER / PROVIDERS</footer>
      </div>
    </main>
  </div>
}
