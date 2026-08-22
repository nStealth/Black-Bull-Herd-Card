// Contract safety signals, read straight off the mint account.
//
// `mintAuthority` null means no new supply can ever be minted; `freezeAuthority`
// null means no one can freeze a holder's token account. Both are the checks a
// buyer actually cares about, and both are free to read on any RPC — no
// third-party "rug score" service involved, so nothing here is an opinion.

import { ANSEM_MINT } from '$lib/tiers';
import { rpcCall } from './rpc';

export interface MintAuthorities {
  mintAuthority: string | null;
  freezeAuthority: string | null;
}

interface ParsedMintAccount {
  value: {
    data?: {
      parsed?: {
        info?: {
          mintAuthority?: string | null;
          freezeAuthority?: string | null;
        };
      };
    };
  } | null;
}

export async function getMintAuthorities(
  mint: string = ANSEM_MINT
): Promise<MintAuthorities | null> {
  const result = await rpcCall<ParsedMintAccount>('getAccountInfo', [
    mint,
    { encoding: 'jsonParsed' }
  ]);

  const info = result.value?.data?.parsed?.info;
  if (!info) return null;

  return {
    mintAuthority: info.mintAuthority ?? null,
    freezeAuthority: info.freezeAuthority ?? null
  };
}
