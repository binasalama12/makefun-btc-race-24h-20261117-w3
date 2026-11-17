// Volatility band reversion, for the bars-replay/v1 protocol. One asset
// (CBBTC against USDC), long only, one position at a time.
//
// A rolling window of closes gives a mean and a standard deviation. The
// lower band is the mean minus BAND_K standard deviations; a close under
// it is an outlier against the market's own recent volatility, and the bot
// buys it, expecting the ordinary pull back to the mean, where it sells.
// Scaling the entry by the deviation instead of by a fixed percentage is
// the point: the same 0.5% dip is unremarkable in a storm and a real
// dislocation in a calm tape, and only the second kind is worth paying the
// round trip's fee, slippage and pool impact on a 600 USDC slice.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

/** Rolling window in bars for the mean and standard deviation. */
const WINDOW = 360;
/** Buy when the close is this many standard deviations below the mean.
 *  Tuned from 1.5 to 1.75 against the dev window: the shallower band also
 *  bought the first leg of the window's one real slide, where the price
 *  kept falling through the mean it was meant to revert to, while every
 *  entry the deeper band took came back. */
const BAND_K = 1.75;
/** Fixed buy size: 600 USDC in raw quote units (6 decimals). */
const SLICE = 600_000_000n;
/** Take the modelled fill wherever it lands; the band edges move slowly,
 *  so a refused order is retried on the next bar on nearly the same terms. */
const MAX_SLIPPAGE_BPS = 10_000;

/** Every close seen so far, oldest first. */
const closes: number[] = [];

await runBars({
  onBatch(state: BarsState): OrderInput[] {
    const symbol = state.hello.symbols[0]?.symbol;
    if (symbol === undefined) return [];
    const closeRaw = state.close(symbol);
    if (closeRaw === null) return [];
    const close = Number(closeRaw) / 1e8; // CBBTC price scale: 8 decimals
    closes.push(close);
    if (state.warmingUp) return [];
    if (closes.length < WINDOW) return [];

    const win = closes.slice(closes.length - WINDOW);
    let sum = 0;
    for (const v of win) sum += v;
    const mean = sum / WINDOW;
    let sq = 0;
    for (const v of win) sq += (v - mean) * (v - mean);
    const sd = Math.sqrt(sq / WINDOW);
    if (sd <= 0) return [];

    const held = state.positions.get(symbol);
    const holding = held !== undefined && held.qty > 0n;

    if (holding) {
      if (close >= mean) {
        return [{ side: 'sell', symbol, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    if (close < mean - BAND_K * sd) {
      let slice = SLICE;
      if (state.cash < slice) slice = state.cash;
      const room = state.weightRoom(symbol);
      if (room < slice) slice = room;
      if (slice <= 0n || slice < BigInt(state.hello.fees.min_notional_quote_units)) return [];
      return [{ side: 'buy', symbol, notional_quote_units: slice, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  },
});
