<script lang="ts">
  import type { Tier } from '$lib/tiers';
  import { formatBalance } from '$lib/tiers';

  type Stat = { label: string; value: string; color?: string };

  export let balance: number;
  export let percentSupply: number;
  export let rank: string;
  export let tier: Tier | null;

  let stats: Stat[] = [];
  $: stats = [
    { label: 'Balance', value: formatBalance(balance), color: tier?.color },
    { label: '% of Supply', value: `${percentSupply.toFixed(4)}%` },
    { label: 'Rank', value: rank, color: '#ffd700' },
    { label: 'Eligible', value: balance >= 1 ? '✅ Yes' : '❌ No', color: balance >= 1 ? '#22c55e' : '#ef4444' }
  ];
</script>

<div class="grid grid-cols-2 gap-3 mt-6">
  {#each stats as stat}
    <div class="bg-cyber-bg-secondary rounded-xl p-4 text-center transition-colors hover:bg-cyber-bg-card-hover">
      <div class="text-xs text-text-muted uppercase tracking-wider mb-1.5">{stat.label}</div>
      <div class="text-lg font-bold font-mono" style={stat.color ? `color: ${stat.color};` : ''}>
        {stat.value}
      </div>
    </div>
  {/each}
</div>
