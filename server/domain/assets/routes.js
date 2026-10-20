import { Router } from 'express'
import mongoose from 'mongoose'
import { Asset } from './Asset.js'

export const assetsRouter = Router()
const writable = new Set(['symbol', 'name', 'type', 'description', 'identifiers', 'tags', 'notes', 'metadata', 'marketData', 'providers', 'preferences', 'enabled'])

function payload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('Expected a JSON object')
    error.status = 400
    throw error
  }
  const unknown = Object.keys(body).filter(key => !writable.has(key))
  if (unknown.length) {
    const error = new Error('Unknown fields: ' + unknown.join(', '))
    error.status = 400
    throw error
  }
  return Object.fromEntries(Object.entries(body).filter(([key]) => writable.has(key)))
}

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid asset ID' })
  next()
}

assetsRouter.get('/', async (req, res, next) => {
  try {
    const query = {}
    if (req.query.type) query.type = String(req.query.type)
    if (req.query.symbol) query.symbol = String(req.query.symbol).trim().toUpperCase()
    if (req.query.provider) query['providers.key'] = String(req.query.provider).trim().toLowerCase()
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200)
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const [assets, total] = await Promise.all([
      Asset.find(query).sort({ symbol: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Asset.countDocuments(query)
    ])
    res.json({ assets, total, page, limit })
  } catch (error) { next(error) }
})

assetsRouter.post('/', async (req, res, next) => {
  try {
    const asset = await Asset.create(payload(req.body))
    res.status(201).json(asset)
  } catch (error) { next(error) }
})

assetsRouter.get('/:id', validId, async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).lean()
    if (!asset) return res.status(404).json({ error: 'Asset not found' })
    res.json(asset)
  } catch (error) { next(error) }
})

assetsRouter.patch('/:id', validId, async (req, res, next) => {
  try {
    const update = payload(req.body)
    if (!Object.keys(update).length) return res.status(400).json({ error: 'No fields supplied' })
    const asset = await Asset.findById(req.params.id)
    if (!asset) return res.status(404).json({ error: 'Asset not found' })
    asset.set(update)
    await asset.save()
    res.json(asset)
  } catch (error) { next(error) }
})

assetsRouter.delete('/:id', validId, async (req, res, next) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Asset not found' })
    res.status(204).end()
  } catch (error) { next(error) }
})
