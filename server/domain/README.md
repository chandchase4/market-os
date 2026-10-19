# MarketOS domain scaffolding

These folders establish boundaries only. No domain CRUD, process runner, event engine, or scanner orchestration is implemented yet.

- assets: canonical assets and market listings; USD and USDT listings stay distinct
- collections: named user lists, including watchlists and generated lists
- memberships: asset/list relationships and provider or market preferences
- processes: scanner, discovery, and snapshot process definitions and runtime state
- subscriptions: per-market data-feed requirements and refresh priorities
- events: rules, triggers, and actions
- snapshots: bounded optional history and export envelopes

Provider integrations remain in server/data-manager/providers. Existing Kraken scanner-item endpoints are legacy and remain intact until the domain migration is designed and implemented.
