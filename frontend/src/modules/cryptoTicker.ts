import type { CoinConfig } from "../types";

/**
 * Coin set and starting values taken directly from the Figma frame. Each
 * coin (where available) is backed by a live Binance ticker stream — a
 * public WebSocket endpoint that needs no API key. Binance does not list a
 * pair for every coin in the mock (Tether is the quote asset itself, and
 * "Midnight" has no liquid USDT pair yet), so those two keep the design's
 * static value instead of silently breaking.
 */
const COINS: CoinConfig[] = [
  { key: "btc", name: "Bitcoin", binanceSymbol: "btcusdt", fallbackPrice: 87965.62, decimals: 2, iconColor: "#f2a93b", iconLabel: "₿", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg", column: "left" },
  { key: "eth", name: "Ethereum", binanceSymbol: "ethusdt", fallbackPrice: 2950.04, decimals: 2, iconColor: "#8296f0", iconLabel: "Ξ", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg", column: "left" },
  { key: "sol", name: "Solana", binanceSymbol: "solusdt", fallbackPrice: 124.53, decimals: 2, iconColor: "#8f5df2", iconLabel: "S", iconUrl: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png", column: "left" },
  { key: "xrp", name: "XRP", binanceSymbol: "xrpusdt", fallbackPrice: 1.862, decimals: 3, iconColor: "#5c6b7a", iconLabel: "X", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/xrp.svg", column: "left" },
  { key: "usdc", name: "USD Coin", binanceSymbol: "usdcusdt", fallbackPrice: 0.9997, decimals: 4, iconColor: "#2775ca", iconLabel: "$", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdc.svg", column: "left" },
  { key: "bnb", name: "Binance Coin", binanceSymbol: "bnbusdt", fallbackPrice: 844.91, decimals: 2, iconColor: "#f0b90b", iconLabel: "B", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/bnb.svg", column: "right" },
  { key: "night", name: "Midnight", binanceSymbol: null, fallbackPrice: 0.06398, decimals: 5, iconColor: "#2b2b40", iconLabel: "M", column: "right" },
  { key: "doge", name: "Dogecoin", binanceSymbol: "dogeusdt", fallbackPrice: 0.1278, decimals: 4, iconColor: "#c8a15e", iconLabel: "D", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/doge.svg", column: "right" },
  { key: "sui", name: "Sui", binanceSymbol: "suiusdt", fallbackPrice: 1.427, decimals: 3, iconColor: "#4da2ff", iconLabel: "S", iconUrl: "https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/sui/info/logo.png", column: "right" },
  { key: "usdt", name: "Tether", binanceSymbol: null, fallbackPrice: 1.0, decimals: 3, iconColor: "#26a17b", iconLabel: "T", iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg", column: "right" }
];

const RECONNECT_DELAY_MS = 4000;

export function initCryptoTicker(): void {
  const leftList = document.getElementById("coin-list-left");
  const rightList = document.getElementById("coin-list-right");
  if (!leftList || !rightList) return;

  for (const coin of COINS) {
    const row = renderCoinRow(coin);
    (coin.column === "left" ? leftList : rightList).appendChild(row);
  }

  connect();
}

function renderCoinRow(coin: CoinConfig): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "coin-row";
  li.dataset.coin = coin.key;
  const iconImg = coin.iconUrl
    ? `<img src="${coin.iconUrl}" alt="" class="coin-icon-img" loading="lazy" onerror="this.remove()" />`
    : "";
  li.innerHTML = `
    <span class="coin-icon" style="background:${coin.iconColor}">${iconImg}${coin.iconLabel}</span>
    <span class="coin-name">${coin.name}</span>
    <span class="coin-price" data-price>${formatPrice(coin.fallbackPrice, coin.decimals)}</span>
  `;
  return li;
}

function connect(): void {
  const streams = COINS.filter((c) => c.binanceSymbol).map((c) => `${c.binanceSymbol}@ticker`).join("/");
  const socket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  socket.addEventListener("message", (event: MessageEvent<string>) => {
    try {
      const payload = JSON.parse(event.data) as { data?: { s: string; c: string } };
      const symbol = payload.data?.s?.toLowerCase();
      const price = payload.data?.c;
      if (!symbol || !price) return;

      const coin = COINS.find((c) => c.binanceSymbol === symbol);
      if (!coin) return;

      updatePriceInDom(coin, Number(price));
    } catch {
      /* Ignore malformed frames rather than crashing the ticker. */
    }
  });

  socket.addEventListener("close", () => {
    window.setTimeout(connect, RECONNECT_DELAY_MS);
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}

const lastPrices = new Map<string, number>();

function updatePriceInDom(coin: CoinConfig, price: number): void {
  const el = document.querySelector<HTMLElement>(`[data-coin="${coin.key}"] [data-price]`);
  if (!el) return;

  const previous = lastPrices.get(coin.key);
  el.textContent = formatPrice(price, coin.decimals);

  if (previous !== undefined && previous !== price) {
    el.classList.remove("is-up", "is-down");
    el.classList.add(price > previous ? "is-up" : "is-down");
    window.setTimeout(() => el.classList.remove("is-up", "is-down"), 900);
  }

  lastPrices.set(coin.key, price);
}

function formatPrice(value: number, decimals: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}
