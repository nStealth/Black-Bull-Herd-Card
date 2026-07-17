<script lang="ts">
  import type { Tier } from '$lib/tiers';

  export let tier: Tier;

  const tierIcons: Record<string, string> = {
    common: '🐂',
    rare: '💎',
    epic: '💜',
    legendary: '👑',
    mythic: '⚡'
  };

  const tierIcon = tierIcons[tier.id] || '🐂';
</script>

<div class="flex justify-center my-6">
  <span
    class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold uppercase tracking-wider border-2 animate-scaleIn"
    style="border-color: {tier.color}; color: {tier.color}; background: {tier.color}30;"
  >
    {tierIcon}
    {tier.name}
  </span>
</div>
