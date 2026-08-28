<script lang="ts">
  // Contract-level safety, read from the mint account and the launchpad state.
  //
  // Deliberately not a score. Each row is a fact with its source, because a
  // single number invites trusting the number instead of the check. Anything we
  // could not read renders as unknown rather than defaulting to a pass.
  //
  // Scope is the contract, not the holder base. Distribution lives in its own
  // panel, and the counter below says "contract checks" so four passes are not
  // read as a verdict on the token as a whole.

  import type { SecurityInfo } from '$lib/dashboard/types';
  import { shortAddress, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { SOURCES } from '$lib/dashboard/sources';

  export let security: SecurityInfo | null;

  type Verdict = 'pass' | 'warn' | 'fail' | 'unknown';

  interface Check {
    key: string;
    label: string;
    detail: string;
    verdict: Verdict;
  }

  const LIQUIDITY_WARN_USD = 50_000;

  function graduationCheck(info: SecurityInfo): Check {
    if (info.graduated === null) {
      return {
        key: 'launchpad',
        label: 'Launchpad status',
        detail: 'No launchpad data for this mint',
        verdict: 'unknown'
      };
    }

    const on = info.graduatedAt
      ? ` on ${new Date(info.graduatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}`
      : '';

    return {
      key: 'launchpad',
      label: 'Launchpad status',
      detail: info.graduated
        ? `Bonding curve completed${on}`
        : 'Still on the bonding curve — not graduated',
      verdict: info.graduated ? 'pass' : 'warn'
    };
  }

  $: checks = security
    ? ([
        {
          key: 'mint',
          label: 'Mint authority',
          detail: security.mintRevoked
            ? 'Revoked — supply cannot be increased'
            : `Active — ${shortAddress(security.mintAuthority ?? '', 6, 6)} can mint`,
          verdict: security.mintRevoked ? 'pass' : 'fail'
        },
        {
          key: 'freeze',
          label: 'Freeze authority',
          detail: security.freezeRevoked
            ? 'Revoked — accounts cannot be frozen'
            : `Active — ${shortAddress(security.freezeAuthority ?? '', 6, 6)} can freeze`,
          verdict: security.freezeRevoked ? 'pass' : 'fail'
        },
        {
          key: 'liquidity',
          label: 'Pooled liquidity',
          detail: `${usdCompact(security.liquidityUsd)} across tracked pools`,
          verdict: security.liquidityUsd >= LIQUIDITY_WARN_USD ? 'pass' : 'warn'
        },
        graduationCheck(security)
      ] satisfies Check[])
    : [];

  const TONE: Record<Verdict, { color: string; mark: string; label: string }> = {
    pass: { color: 'var(--d-up)', mark: '✓', label: 'Pass' },
    warn: { color: 'var(--d-warn-ink)', mark: '!', label: 'Caution' },
    fail: { color: 'var(--d-down)', mark: '✕', label: 'Risk' },
    unknown: { color: 'var(--d-text-3)', mark: '?', label: 'Unknown' }
  };

  $: passed = checks.filter((c) => c.verdict === 'pass').length;
  $: measured = checks.filter((c) => c.verdict !== 'unknown').length;
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex items-baseline justify-between gap-3 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Contract Safety
      <InfoTip label="Contract Safety" text="Checks read straight from the mint account on-chain. Deliberately a list of facts rather than a single score — a score invites trusting the number instead of the check. Anything we could not read says Unknown rather than defaulting to a pass." source={SOURCES.chain} />
    </h2>
    {#if security}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        {passed}/{measured} contract checks
      </span>
    {/if}
  </header>

  {#if security}
    <div class="flex flex-1 flex-col justify-around">
      {#each checks as check, i (check.key)}
        {@const tone = TONE[check.verdict]}
        <div class="px-5 py-3" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
          <div class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-xs font-medium" style="color: var(--d-text);">
              <span
                class="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.625rem] font-bold"
                style="color: {tone.color}; background: color-mix(in srgb, {tone.color} 16%, transparent);"
                aria-hidden="true"
              >
                {tone.mark}
              </span>
              {check.label}
            </span>
            <span class="shrink-0 text-[0.6875rem] font-semibold" style="color: {tone.color};">
              {tone.label}
            </span>
          </div>
          <p class="mt-1 break-words pl-6 text-[0.6875rem]" style="color: var(--d-text-3);">
            {check.detail}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Safety checks unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        The mint account could not be read on this refresh.
      </p>
    </div>
  {/if}
</section>
