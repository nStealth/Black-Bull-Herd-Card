<script lang="ts">
  // Campaign close-out notice.
  //
  // The claim window shut on 17 Aug 2026. Leaving the page looking live would
  // have people connecting wallets for a card they can no longer claim, so this
  // says so plainly and points at the thing that is still running: the
  // analytics dashboard.
</script>

<section
  class="relative mb-10 overflow-hidden rounded-3xl border border-accent-amber/25 bg-gradient-to-br from-accent-amber/[0.07] via-cyber-bg-card to-cyber-bg-card p-8 max-md:p-6"
  aria-labelledby="campaign-ended-heading"
>
  <div
    class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-amber/50 to-transparent"
    aria-hidden="true"
  />

  <div class="flex flex-col items-center gap-5 text-center">
    <span
      class="inline-flex items-center gap-2 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent-amber"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-accent-amber" aria-hidden="true" />
      Campaign closed
    </span>

    <h2 id="campaign-ended-heading" class="text-2xl font-bold text-text-primary max-md:text-xl">
      The Herd Card campaign has ended
    </h2>

    <p class="max-w-2xl text-[0.9375rem] leading-relaxed text-text-secondary">
      Submissions closed on <strong class="text-text-primary">17 August 2026</strong>. Thank you to
      everyone who joined the herd — new cards can no longer be claimed.
    </p>

    <div class="my-1 h-px w-16 bg-white/10" aria-hidden="true" />

    <p class="max-w-2xl text-[0.9375rem] leading-relaxed text-text-secondary">
      What lives on is <strong class="text-text-primary">ANSEM Analytics</strong> — a live overwatch
      for the token. Price history, order flow, trade depth at size, contract safety, holder
      rankings and supply distribution, all on one screen and refreshed automatically.
    </p>

    <a
      href="/dashboard"
      class="group mt-2 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-accent-amber to-accent-gold px-7 py-3.5 text-[0.9375rem] font-bold text-cyber-bg shadow-lg shadow-amber-900/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-900/40"
    >
      Open ANSEM Analytics
      <span class="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
    </a>

    <p class="text-xs text-text-muted">
      Free, no wallet connection required
    </p>
  </div>
</section>
