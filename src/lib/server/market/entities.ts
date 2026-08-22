// Best-effort labels for addresses that are not individual holders.
//
// Liquidity pools and exchange hot wallets routinely sit in the top ranks and
// would otherwise read as "whales". Labelling them keeps the leaderboard honest.
// This is a static registry: an unlabelled address simply shows as a wallet.

const KNOWN_ENTITIES: Record<string, string> = {
  // Raydium
  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': 'Raydium AMM',
  GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ: 'Raydium Pool',
  // Pump.fun
  '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg': 'Pump.fun',
  CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM: 'Pump.fun Fee',
  // Centralised exchanges
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': 'Binance',
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': 'Binance',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'Coinbase',
  H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS: 'Coinbase',
  AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2: 'Bybit',
  u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w: 'Gate.io',
  '5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD': 'OKX',
  A77HErqtfN1hLLpvZ9pCtu66FEtM8BveoaKbbMoZ4RiR: 'Bitget',
  GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE: 'Kraken',
  '3gd3dqgtJ4jWfBfLYTX67DALFetjc5iS72sCgRhCkW2u': 'MEXC'
};

export function entityMap(poolAddresses: Set<string>): Map<string, string> {
  const map = new Map<string, string>(Object.entries(KNOWN_ENTITIES));
  for (const address of poolAddresses) {
    if (!map.has(address)) map.set(address, 'Liquidity Pool');
  }
  return map;
}
