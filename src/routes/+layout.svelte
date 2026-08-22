<script lang="ts">
  // Bare root layout. Site chrome lives in (site)/+layout.svelte and the
  // dashboard supplies its own, so the two share no header, footer or nav.
  import '../app.css';
</script>

<slot />
