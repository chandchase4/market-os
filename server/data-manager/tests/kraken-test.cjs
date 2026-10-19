
const WebSocket = require("ws");

const URL = "wss://ws.kraken.com/v2";
const SYMBOLS = ["BTC/USD", "ETH/USD"];

let reconnectAttempts = 0;
let socket;

function connect() {
    console.log("Connecting to Kraken...");
    socket = new WebSocket(URL);

    socket.on("open", () => {
        reconnectAttempts = 0;
        console.log("Connected to Kraken!");

        socket.send(JSON.stringify({
            method: "subscribe",
            params: {
                channel: "ticker",
                symbol: SYMBOLS,
                event_trigger: "trades",
                snapshot: true
            }
        }));
    });

    socket.on("message", (raw) => {
        try {
            const message = JSON.parse(raw.toString());

            if (message.method === "subscribe") {
                console.log("Subscription:", message.result?.symbol,
                    message.success ? "OK" : message.error);
                return;
            }

            if (message.channel !== "ticker") return;

            for (const ticker of message.data ?? []) {
                console.log(
                    `[${message.type}] ${ticker.symbol}`,
                    `Price: $${ticker.last}`,
                    `24h change: ${ticker.change_pct}%`,
                    `Volume: ${ticker.volume}`,
                    `Time: ${ticker.timestamp}`
                );
            }
        } catch (error) {
            console.error("Message error:", error.message);
        }
    });

    socket.on("error", (error) => {
        console.error("WebSocket error:", error.message);
    });

    socket.on("close", () => {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectAttempts++;
        console.log(`Disconnected. Reconnecting in ${delay / 1000}s...`);
        setTimeout(connect, delay);
    });
}

connect();
