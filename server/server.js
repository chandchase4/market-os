
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from './db.js'

const app = express()
const port = Number(process.env.PORT || 3001)

// Middleware
app.disable('x-powered-by')
app.use(express.json())

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

  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`MarketOS API running on port ${port}`)
    console.log('MongoDB connected')
  })

  // Graceful shutdown
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(() => {
        void disconnectDatabase().finally(() => process.exit(0))
      })
    })
  }
} catch (error) {
  console.error('Startup failed:', error.message)
  process.exitCode = 1
}
