import { Router } from 'express'
import { OkxFeed } from './OkxFeed.js'

export const okxRouter = Router()
const clients = new Set()
const ticks = new Map()
let status = 'connecting'

function publish(event, payload) {
  const frame = 'event: ' + event + '\n' + 'data: ' + JSON.stringify(payload) + '\n\n'
  for (const res of clients) res.write(frame)
}

const feed = new OkxFeed(
  tick => {
    ticks.set(tick.symbol, tick)
    publish('tick', tick)
  },
  next => {
    status = next
    publish('status', { status })
  }
)

okxRouter.get('/status', (_req, res) => {
  res.json({ status, symbols: ['BTC-USDT', 'ETH-USDT'], ticks: [...ticks.values()] })
})

okxRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  clients.add(res)
  res.write('event: status\ndata: ' + JSON.stringify({ status }) + '\n\n')
  for (const tick of ticks.values()) res.write('event: tick\ndata: ' + JSON.stringify(tick) + '\n\n')
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000)
  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
  })
})

export function stopOkxFeed() {
  feed.close()
  for (const res of clients) res.end()
}
