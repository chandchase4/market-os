import { useEffect, useMemo, useState } from 'react'
import './App.css'

const api = '/api/kraken'
const money = value => value == null ? '—' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
const numeric = value => value == null ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })

export default function App() {
  const [items, setItems] = useState([])
  const [ticks, setTicks] = useState({})
  const [connection, setConnection] = useState('connecting')
  const [symbol, setSymbol] = useState('')
  const [label, setLabel] = useState('')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({ label: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function request(path, options) {
    const response = await fetch(api + path, { headers: { 'Content-Type': 'application/json' }, ...options })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Request failed (' + response.status + ')')
    }
    return response.status === 204 ? null : response.json()
  }

  useEffect(() => {
    let alive = true
    request('/items').then(data => { if (alive) setItems(data) }).catch(e => { if (alive) setError(e.message) })
    const stream = new EventSource(api + '/events')
    stream.addEventListener('status', e => { if (alive) setConnection(JSON.parse(e.data).status) })
    stream.addEventListener('tick', e => {
      if (!alive) return
      const tick = JSON.parse(e.data)
      setTicks(old => ({ ...old, [tick.symbol]: tick }))
    })
    stream.addEventListener('items', e => { if (alive) setItems(JSON.parse(e.data)) })
    stream.onerror = () => { if (alive) setConnection('reconnecting') }
    return () => { alive = false; stream.close() }
  }, [])

  async function mutate(task) {
    setBusy(true); setError('')
    try { await task(); setItems(await request('/items')) }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function add(e) {
    e.preventDefault()
    mutate(async () => {
      await request('/items', { method: 'POST', body: JSON.stringify({ symbol, label }) })
      setSymbol(''); setLabel('')
    })
  }

  function beginEdit(item) {
    setEditing(item._id)
    setDraft({ label: item.label || '', note: item.note || '' })
  }

  const active = useMemo(() => items.filter(item => item.enabled).length, [items])
  const live = useMemo(() => items.filter(item => ticks[item.symbol]).length, [items, ticks])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">M<span>●</span></div><div><strong>MarketOS</strong><small>WORKSPACE / 1.0</small></div></div>
        <div className="nav-heading">WORKSPACE</div>
        <div className="nav-link selected"><span className="nav-icon">▦</span> Kraken Scanner <span className="nav-count">{items.length}</span></div>
        <div className="nav-link muted"><span className="nav-icon">◈</span> Data Manager <span className="soon">SOON</span></div>
        <div className="nav-link muted"><span className="nav-icon">◎</span> Watchlists <span className="soon">SOON</span></div>
        <div className="sidebar-bottom"><span className="dot" /> KRAKEN SPOT <small>Public market data</small></div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Scanners <span>/</span> <b>Kraken</b></div><div className="top-right"><span className="top-pill">● LIVE DATA</span><span className="avatar">M</span></div></header>
        <div className="content">
          <div className="eyebrow">MARKET DATA / KRAKEN</div>
          <div className="heading"><div><h1>Kraken Scanner <span className="version">v0.1</span></h1><p>Your first live spot-market workspace. Add, edit, pause, and remove tracked pairs.</p></div><div className={'connection ' + (connection === 'connected' ? 'online' : '')}><span className="dot" /> {connection}</div></div>

          <section className="stats">
            <div className="stat"><span>TRACKED PAIRS</span><strong>{items.length.toString().padStart(2, '0')}</strong><small>Total saved symbols</small></div>
            <div className="stat"><span>ACTIVE SUBSCRIPTIONS</span><strong>{active.toString().padStart(2, '0')}</strong><small>Enabled on Kraken WS</small></div>
            <div className="stat"><span>PAIRS WITH DATA</span><strong>{live.toString().padStart(2, '0')}</strong><small>Received ticker snapshot or update</small></div>
            <div className="stat"><span>DATA PROVIDER</span><strong className="provider">Kraken <i>↗</i></strong><small>WebSocket v2 · Spot</small></div>
          </section>

          <section className="panel add-panel">
            <div className="section-title"><div><h2>Add a market</h2><p>Subscribe to a Kraken spot pair. Example: BTC/USD or ETH/USD.</p></div><span className="section-tag">CREATE</span></div>
            <form className="add-form" onSubmit={add}>
              <label>MARKET SYMBOL<input required placeholder="e.g. SOL/USD" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} /></label>
              <label>DISPLAY NAME <span>(OPTIONAL)</span><input placeholder="e.g. Solana" value={label} onChange={e => setLabel(e.target.value)} /></label>
              <button className="primary" disabled={busy}>＋ Add pair</button>
            </form>
          </section>

          {error && <div className="error" role="alert">{error}<button onClick={() => setError('')}>✕</button></div>}

          <section className="panel scanner">
            <div className="section-title"><div><h2>Tracked markets <span className="count">{items.length}</span></h2><p>Live ticker data streams directly from the Kraken connection.</p></div><span className="section-tag"><span className="dot" /> REAL-TIME</span></div>
            <div className="table-wrap"><table><thead><tr><th>ASSET / PAIR</th><th>LAST PRICE</th><th>24H CHANGE</th><th>24H VOLUME</th><th>LAST RECEIVED</th><th>STATUS</th><th className="actions">ACTIONS</th></tr></thead><tbody>
              {items.map(item => {
                const tick = ticks[item.symbol]
                const change = tick?.change_pct
                return <tr key={item._id} className={!item.enabled ? 'paused' : ''}>
                  <td><div className="asset"><div className="asset-icon">{item.symbol.slice(0, 1)}</div><div><strong>{item.symbol}</strong><small>{item.label || 'Kraken spot market'}</small></div></div></td>
                  <td className="price">{tick?.last != null ? '$' + money(tick.last) : '—'}</td>
                  <td><span className={change == null ? 'neutral' : Number(change) >= 0 ? 'positive' : 'negative'}>{change == null ? '—' : (Number(change) > 0 ? '+' : '') + Number(change).toFixed(2) + '%'}</span></td>
                  <td className="volume">{numeric(tick?.volume)}</td>
                  <td className="timestamp">{tick?.receivedAt ? new Date(tick.receivedAt).toLocaleTimeString() : 'Waiting…'}</td>
                  <td><span className={'status ' + (item.enabled ? 'enabled' : 'disabled')}><span className="dot" />{item.enabled ? 'Active' : 'Paused'}</span></td>
                  <td><div className="row-actions"><button title="Edit" onClick={() => beginEdit(item)}>Edit</button><button disabled={busy} title={item.enabled ? 'Pause' : 'Resume'} onClick={() => mutate(() => request('/items/' + item._id, { method: 'PATCH', body: JSON.stringify({ enabled: !item.enabled }) }))}>{item.enabled ? 'Pause' : 'Resume'}</button><button className="delete" disabled={busy} title="Remove" onClick={() => { if (window.confirm('Remove ' + item.symbol + ' from the scanner?')) mutate(() => request('/items/' + item._id, { method: 'DELETE' })) }}>×</button></div></td>
                </tr>
              })}
              {items.length === 0 && <tr><td colSpan="7" className="empty"><div className="empty-icon">◈</div><strong>No markets yet</strong><p>Add BTC/USD above to start receiving Kraken ticker data.</p></td></tr>}
            </tbody></table></div>
            <div className="table-footer"><span><span className="dot" /> Connected through MarketOS backend</span><span>NO SORTING · NO FILTERS · CRUD MVP</span></div>
          </section>
          <footer>MARKETOS 1.0 <span>·</span> DATA MANAGER / KRAKEN PROVIDER <span>·</span> PUBLIC MARKET DATA</footer>
        </div>
      </main>

      {editing && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null) }}><div className="modal"><div className="modal-heading"><h2>Edit market</h2><button onClick={() => setEditing(null)}>✕</button></div><p>Update the label and notes for this tracked pair.</p><form onSubmit={e => { e.preventDefault(); mutate(async () => { await request('/items/' + editing, { method: 'PATCH', body: JSON.stringify(draft) }); setEditing(null) }) }}><label>DISPLAY NAME<input maxLength="80" value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} /></label><label>NOTES<textarea maxLength="500" rows="4" value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label><div className="modal-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className="primary" disabled={busy}>Save changes</button></div></form></div></div>}
    </div>
  )
}
