<script lang="ts">
  // Restrained ambient backdrop: a faint grid with a sparse, slow-drifting node
  // mesh. Minimal by design — it should read as texture, never as decoration.
  // One rAF loop, DPR-aware, parked when the tab is hidden or motion is reduced.
  import { onMount } from 'svelte';
  import { theme } from '$lib/dashboard/theme';

  let canvas: HTMLCanvasElement;

  interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
  }

  const LINK_DISTANCE = 150;
  const DRIFT = 0.12;

  function nodeCount(width: number, height: number): number {
    return Math.round(Math.min(46, Math.max(16, (width * height) / 52_000)));
  }

  onMount(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;
    let running = true;
    let dot = '';
    let line = '';

    function readPalette() {
      const light = document.documentElement.getAttribute('data-dash-theme') === 'light';
      dot = light ? 'rgba(0, 168, 98, 0.30)' : 'rgba(0, 212, 126, 0.34)';
      line = light ? 'rgba(15, 20, 25, 0.055)' : 'rgba(255, 255, 255, 0.055)';
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = Array.from({ length: nodeCount(width, height) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * DRIFT,
        vy: (Math.random() - 0.5) * DRIFT
      }));
    }

    function paint() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance > LINK_DISTANCE) continue;

          ctx!.globalAlpha = 1 - distance / LINK_DISTANCE;
          ctx!.strokeStyle = line;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }

        ctx!.globalAlpha = 1;
        ctx!.fillStyle = dot;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 1.3, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      if (!running) return;
      paint();

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      frame = requestAnimationFrame(step);
    }

    function start() {
      cancelAnimationFrame(frame);
      if (reduceMotion.matches || document.hidden) {
        running = false;
        paint();
        return;
      }
      running = true;
      frame = requestAnimationFrame(step);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else {
        start();
      }
    }

    readPalette();
    resize();
    start();

    const unsubscribe = theme.subscribe(() => {
      requestAnimationFrame(() => {
        readPalette();
        if (!running) paint();
      });
    });

    const observer = new ResizeObserver(() => {
      resize();
      if (!running) paint();
    });
    observer.observe(canvas);

    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener('change', start);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener('change', start);
      unsubscribe();
    };
  });
</script>

<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
  <div
    class="absolute inset-0"
    style="background-image:
      linear-gradient(var(--d-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--d-grid) 1px, transparent 1px);
      background-size: 48px 48px;"
  />
  <canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
</div>
