export interface CoinConfig {
  /** Stable key used in the DOM (data-coin attribute). */
  key: string;
  /** Display name, matches the Figma copy exactly. */
  name: string;
  /** Lower-case Binance trading pair used for the live ticker stream, e.g. "btcusdt". */
  binanceSymbol: string | null;
  /** Starting price shown before the socket connects / for symbols with no public stream. */
  fallbackPrice: number;
  /** How many decimal places to render for this coin. */
  decimals: number;
  /** Background colour for the round coin icon. */
  iconColor: string;
  /** One or two letters rendered inside the icon (fallback if iconUrl fails to load). */
  iconLabel: string;
  /** Optional URL to the coin's real logo image, drawn on top of the letter fallback. */
  iconUrl?: string;
  /** Column this coin renders in, matches the two-column layout in the design. */
  column: "left" | "right";
}

export interface GoogleProfile {
  name: string;
  email: string;
  picture: string;
}
