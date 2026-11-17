[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/binasalama12/makefun-btc-race-24h-20261117-w3/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/binasalama12/makefun-btc-race-24h-20261117-w3/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

# Volatility Band Reversion — cbBTC/USDC

Repository: makefun-btc-race-24h-20261117-w3

Competition: https://make.fun/bounty/btc-race-24h-20261117-0603

A Bollinger-style reversion bot for the make.fun BTC race. Over a rolling
360-bar window of cbBTC closes it keeps the mean and the standard
deviation, and it buys a 600 USDC slice when a bar closes at least 1.75
standard deviations below the mean — a stretch that is unusual for this
market's own recent behaviour, whatever the absolute price has done. The
position is sold in full when a bar closes back at or above the rolling
mean. Because the band is scaled by measured volatility rather than fixed
in percentage terms, the bot demands a bigger dislocation before buying
when the market is wild and accepts a smaller one when it is quiet, and it
never needs to know whether the day has trended up or down: the window
moves with the price. While the price is inside the band the bot holds
cash. Every decision is a deterministic function of the bar stream — the
hello, each batch of bars and the orders it answers — so two runs over the
same bars produce the same orders byte for byte.
