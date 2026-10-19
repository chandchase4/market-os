import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, trim: true, uppercase: true },
  label: { type: String, default: '', trim: true, maxlength: 80 },
  note: { type: String, default: '', maxlength: 500 },
  enabled: { type: Boolean, default: true }
}, { timestamps: true })

export const ScannerItem = mongoose.models.KrakenScannerItem || mongoose.model('KrakenScannerItem', schema)
