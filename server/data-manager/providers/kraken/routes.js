import { Router } from 'express'
import { ScannerItem } from './ScannerItem.js'
import { KrakenFeed } from './KrakenFeed.js'

export const krakenRouter = Router()
const clients = new Set()
const ticks = new Map()
let status = 'connecting'

function publish(event, data) {
  for (const res of clients) res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n')
}

const feed = new KrakenFeed(
  tick => {
    ticks.set(tick.symbol, { ...tick, receivedAt: new Date().toISOString() })
    publish('tick', ticks.get(tick.symbol))
  },
  next => { status = next; publish('status', { status }) }
)

async function sync() {
  const items = await ScannerItem.find({ enabled: true }).lean()
  feed.setSymbols(items.map(x => x.symbol))
  publish('items', await ScannerItem.find().sort({ createdAt: 1 }).lean())
}

krakenRouter.get('/items', async (_req, res, next) => {
  try { res.json(await ScannerItem.find().sort({ createdAt: 1 }).lean()) } catch (e) { next(e) }
})

krakenRouter.post('/items', async (req, res, next) => {
  try {
    const symbol = String(req.body.symbol || '').trim().toUpperCase()
    if (!/^[A-Z0-9]+\/[A-Z0-9]+$/.test(symbol)) return res.status(400).json({ error: 'Use a Kraken spot pair like BTC/USD.' })
    const item = await ScannerItem.create({
      symbol, label: String(req.body.label || '').trim(), note: String(req.body.note || '').trim(), enabled: req.body.enabled !== false
    })
    await sync()
    res.status(201).json(item)
  } catch (e) { next(e) }
})

krakenRouter.patch('/items/:id', async (req, res, next) => {
  try {
    const update = {}
    if (req.body.label !== undefined) update.label = String(req.body.label).trim()
    if (req.body.note !== undefined) update.note = String(req.body.note).trim()
    if (req.body.enabled !== undefined) update.enabled = req.body.enabled === true
    const item = await ScannerItem.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    await sync()
    res.json(item)
  } catch (e) { next(e) }
})

krakenRouter.delete('/items/:id', async (req, res, next) => {
  try {
    const item = await ScannerItem.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: 'Item not found' })
    ticks.delete(item.symbol)
    await sync()
    res.status(204).end()
  } catch (e) { next(e) }
})

krakenRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  clients.add(res)
  res.write('event: status\ndata: ' + JSON.stringify({ status }) + '\n\n')
  for (const tick of ticks.values()) res.write('event: tick\ndata: ' + JSON.stringify(tick) + '\n\n')
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000)
  req.on('close', () => { clearInterval(heartbeat); clients.delete(res) })
})

export async function startKrakenScanner() { await sync() }
export function stopKrakenScanner() { feed.close(); for (const res of clients) res.end() }
