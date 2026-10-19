
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from './db.js'
import { krakenRouter, startKrakenScanner, stopKrakenScanner } from './data-manager/providers/kraken/routes.js'

const app = express()
const port = Number(process.env.PORT || 3001)

// Middleware
app.disable('x-powered-by')
app.use(express.json())

app.use('/api/kraken', krakenRouter)

app.use((err, _req, res, _next) => {
  console.error('API error:', err.message)
  res.status(err.code === 11000 ? 409 : err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500).json({ error: err.code === 11000 ? 'Pair already exists' : err.message })
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'MarketOS',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected'
  })
})

// Start server
try {
  await connectDatabase()
  await startKrakenScanner()

  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`MarketOS API running on port ${port}`)
    console.log('MongoDB connected')
  })

  // Graceful shutdown
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      stopKrakenScanner()
      server.close(() => {
        void disconnectDatabase().finally(() => process.exit(0))
      })
    })
  }
} catch (error) {
  console.error('Startup failed:', error.message)
  process.exitCode = 1
}
