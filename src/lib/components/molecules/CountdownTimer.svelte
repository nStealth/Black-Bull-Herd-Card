<script lang="ts">
  let campaignEnds = new Date('2026-08-09T23:59:59Z');

  let timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };

  function updateTimer() {
    const now = Date.now();
    const distance = campaignEnds.getTime() - now;

    if (distance < 0) {
      timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    timeRemaining = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  }

  updateTimer();
  const interval = setInterval(updateTimer, 1000);

  function pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
</script>

<div class="flex items-center gap-4 bg-cyber-bg-card border border-cyber-border rounded-2xl px-6 py-3 shadow-xl shadow-black/30 mx-auto w-fit">
  <span class="text-xs text-text-muted uppercase tracking-wider whitespace-nowrap">Campaign Ends In</span>
  <div class="flex items-center gap-1">
    {#each [
      { value: timeRemaining.days, label: 'Days' },
      { value: timeRemaining.hours, label: 'Hours' },
      { value: timeRemaining.minutes, label: 'Min' },
      { value: timeRemaining.seconds, label: 'Sec' }
    ] as item, i}
      <div class="flex flex-col items-center min-w-[40px]">
        <span class="font-mono text-xl font-bold text-red-500 leading-none">{pad(item.value)}</span>
        <span class="text-[10px] text-text-muted uppercase">{item.label}</span>
      </div>
      {#if i < 3}
        <span class="text-xl font-bold text-text-muted mb-2">:</span>
      {/if}
    {/each}
  </div>
</div>
