# MarketOS 1.0

Scanner MVP with **Kraken + OKX** live market feeds.

## Run locally

Install dependencies if needed, start MongoDB, then from the repository root:

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

Open http://localhost:5173/

## MVP

- One React Router home route (`/`) displaying the scanner.
- Kraken pairs: add/remove from the UI; saved in MongoDB through the existing `KrakenScannerItem` model.
- OKX: BTC-USDT and ETH-USDT (fixed for this MVP).
- Live ticker updates from backend Server-Sent Events.
- Sort and filter the combined live market table.
- Kraken and OKX WebSockets remain on the backend; Coinbase adapter remains in the repository but is not shown in this MVP.

## Notes

MongoDB must be available for the server to start. Kraken's ticker channel is trade-triggered; a row can remain blank until the provider sends a ticker update. OKX volume is base-asset 24h volume. No generic Process Manager, historical scanner results, or asset registry is implemented yet.
