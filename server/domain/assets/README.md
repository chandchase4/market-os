# Assets API (MVP)

Assets are canonical identities, with embedded provider relationships and structured service descriptions. These records are configuration and metadata; they do **not** automatically create exchange subscriptions. Existing Kraken/OKX scanner connections are unchanged.

## Endpoints

- `GET /api/assets` — paginated list (`page`, `limit`, `type`, `symbol`, `provider` filters)
- `POST /api/assets` — create
- `GET /api/assets/:id` — retrieve
- `PATCH /api/assets/:id` — update supplied top-level fields (nested provider arrays are replaced when supplied)
- `DELETE /api/assets/:id` — delete

`type + symbol` is unique. A provider `key` must be unique within an Asset; service `key` must be unique within a provider. Preferences must refer to enabled providers and available services. `marketSymbol` is the provider-specific pair, **not** the canonical asset symbol.

## Example: create Bitcoin

```json
{
  "symbol": "BTC",
  "name": "Bitcoin",
  "type": "crypto",
  "providers": [
    {
      "key": "kraken",
      "displayName": "Kraken",
      "assetSymbol": "BTC",
      "exchange": "Kraken",
      "marketSymbols": ["BTC/USD", "BTC/USDT"],
      "services": [
        {
          "key": "ticker-usd-ws",
          "kind": "ticker",
          "transport": "websocket",
          "marketSymbol": "BTC/USD",
          "channel": "ticker",
          "dataFields": ["last", "volume", "change_pct"]
        },
        {
          "key": "ticker-usdt-ws",
          "kind": "ticker",
          "transport": "websocket",
          "marketSymbol": "BTC/USDT",
          "channel": "ticker"
        }
      ]
    },
    {
      "key": "okx",
      "displayName": "OKX",
      "assetSymbol": "BTC",
      "exchange": "OKX",
      "marketSymbols": ["BTC-USDT"],
      "services": [
        {
          "key": "ticker-usdt-ws",
          "kind": "ticker",
          "transport": "websocket",
          "marketSymbol": "BTC-USDT",
          "channel": "tickers",
          "dataFields": ["last", "vol24h", "open24h"]
        }
      ]
    }
  ],
  "preferences": {
    "default": {
      "provider": "kraken",
      "service": "ticker-usdt-ws",
      "marketSymbol": "BTC/USDT"
    },
    "byDataType": {
      "ticker": {
        "provider": "okx",
        "service": "ticker-usdt-ws",
        "marketSymbol": "BTC-USDT"
      }
    }
  }
}
```

`providers` can also include Coinbase, Binance, or any future provider, but storing a relationship does not imply a live integration is implemented. Do not put API secrets or executable instructions into Asset documents. Keep secrets in server environment variables. Provider adapters own actual connection behavior.

`marketData` is optional manually persisted/cached information; high-frequency live ticks stay in server RAM.

## Example curl

```bash
curl http://localhost:3001/api/assets
curl -X POST http://localhost:3001/api/assets -H 'Content-Type: application/json' -d '{"symbol":"ETH","name":"Ethereum","type":"crypto"}'
```
