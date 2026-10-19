import { Router } from 'express'
import { CoinbaseFeed, products } from './CoinbaseFeed.js'

export const coinbaseRouter = Router()
const clients = new Set()
const ticks = new Map()
let status = 'connecting'

function send(res, event, payload) {
  res.write('event: ' + event + '\n' + 'data: ' + JSON.stringify(payload) + '\n\n')
}
function publish(event, payload) {
  for (const res of clients) send(res, event, payload)
}

const feed = new CoinbaseFeed(
  tick => { ticks.set(tick.symbol, tick); publish('tick', tick) },
  next => { status = next; publish('status', { status }) }
)

coinbaseRouter.get('/status', (_req, res) => {
  res.json({ status, symbols: products, ticks: [...ticks.values()] })
})
coinbaseRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  clients.add(res)
  send(res, 'status', { status })
  for (const tick of ticks.values()) send(res, 'tick', tick)
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000)
  req.on('close', () => { clearInterval(heartbeat); clients.delete(res) })
})

export function stopCoinbaseFeed() {
  feed.close()
  for (const res of clients) res.end()
}
