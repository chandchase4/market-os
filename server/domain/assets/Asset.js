import mongoose from 'mongoose'

const { Schema } = mongoose

const ServiceSchema = new Schema({
  key: { type: String, required: true, trim: true, lowercase: true },
  kind: { type: String, required: true, enum: ['ticker', 'trades', 'orderbook', 'candles', 'metadata', 'other'] },
  transport: { type: String, required: true, enum: ['websocket', 'rest', 'other'] },
  available: { type: Boolean, default: true },
  marketSymbol: { type: String, required: true, trim: true },
  channel: { type: String, trim: true, default: '' },
  interval: { type: String, trim: true, default: '' },
  parameters: { type: Schema.Types.Mixed, default: {} },
  dataFields: [{ type: String, trim: true }],
  notes: { type: String, default: '', maxlength: 1000 }
}, { _id: false })

const ProviderSchema = new Schema({
  key: { type: String, required: true, trim: true, lowercase: true },
  displayName: { type: String, trim: true, default: '' },
  assetId: { type: String, trim: true, default: '' },
  assetSymbol: { type: String, trim: true, default: '' },
  exchange: { type: String, trim: true, default: '' },
  marketSymbols: [{ type: String, trim: true }],
  enabled: { type: Boolean, default: true },
  services: { type: [ServiceSchema], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false })

const PreferenceSchema = new Schema({
  provider: { type: String, required: true, trim: true, lowercase: true },
  service: { type: String, required: true, trim: true, lowercase: true },
  marketSymbol: { type: String, trim: true, default: '' }
}, { _id: false })

const AssetSchema = new Schema({
  symbol: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['crypto', 'stock', 'etf', 'forex', 'other'] },
  description: { type: String, default: '' },
  identifiers: { type: Map, of: String, default: {} },
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
  marketData: { type: Schema.Types.Mixed, default: {} },
  providers: { type: [ProviderSchema], default: [] },
  preferences: {
    default: { type: PreferenceSchema, default: undefined },
    byDataType: { type: Map, of: PreferenceSchema, default: {} }
  },
  enabled: { type: Boolean, default: true }
}, { timestamps: true, optimisticConcurrency: true })

AssetSchema.index({ type: 1, symbol: 1 }, { unique: true })
AssetSchema.index({ 'providers.key': 1 })

AssetSchema.pre('validate', function (next) {
  const keys = new Set()
  for (const provider of this.providers) {
    if (keys.has(provider.key)) {
      this.invalidate('providers', 'Provider keys must be unique per asset')
      break
    }
    keys.add(provider.key)
    const services = new Set()
    for (const service of provider.services) {
      if (services.has(service.key)) {
        this.invalidate('providers', 'Service keys must be unique within each provider')
        break
      }
      services.add(service.key)
    }
  }
  const check = (preference, path) => {
    if (!preference) return
    const provider = this.providers.find(p => p.key === preference.provider)
    const service = provider?.services.find(s => s.key === preference.service && s.available)
    if (!provider?.enabled || !service || (preference.marketSymbol && service.marketSymbol !== preference.marketSymbol)) {
      this.invalidate(path, 'Preference must reference an enabled provider and available service with a matching market symbol')
    }
  }
  check(this.preferences?.default, 'preferences.default')
  for (const [kind, preference] of this.preferences?.byDataType || []) check(preference, 'preferences.byDataType.' + kind)
  next()
})

export const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema)
