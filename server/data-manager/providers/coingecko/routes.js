import { Router } from 'express'
import { CoinGeckoFeed, coins } from './CoinGeckoFeed.js'

export const coingeckoRouter = Router()
const clients = new Set()
const ticks = new Map()
let status = 'connecting'
function send(res, event, data) {
  res.write('event: ' + event + '\n' + 'data: ' + JSON.stringify(data) + '\n\n')
}
function publish(event, data) { for (const res of clients) send(res, event, data) }
const feed = new CoinGeckoFeed(
  tick => { ticks.set(tick.symbol, tick); publish('tick', tick) },
  next => { status = next; publish('status', { status }) }
)
coingeckoRouter.get('/status', (_req, res) => res.json({ status, symbols: coins, ticks: [...ticks.values()] }))
coingeckoRouter.get('/events', (req, res) => {
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
export function stopCoinGeckoFeed() {
  feed.close()
  for (const res of clients) res.end()
}
