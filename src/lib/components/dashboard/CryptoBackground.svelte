<script lang="ts">
  // Ambient crypto-themed canvas backdrop: a drifting node mesh over a slowly
  // scrolling candlestick silhouette. One rAF loop, DPR-aware, and it parks
  // itself whenever the tab is hidden or the user asked for reduced motion.
  import { onMount } from 'svelte';
  import { theme } from '$lib/dashboard/theme';

  let canvas: HTMLCanvasElement;

  interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
  }

  interface Candle {
    open: number;
    close: number;
    high: number;
    low: number;
  }

  const LINK_DISTANCE = 130;
  const CANDLE_WIDTH = 26;
  const CANDLE_SPEED = 0.22; // px per frame

  /** Density scales with viewport area but stays bounded on huge screens. */
  function nodeCount(width: number, height: number): number {
    return Math.round(Math.min(90, Math.max(28, (width * height) / 26_000)));
  }

  function makeCandles(count: number): Candle[] {
    const candles: Candle[] = [];
    let price = 0.5;

    for (let i = 0; i < count; i++) {
      const open = price;
      // Gentle upward drift so the silhouette reads as a bull chart.
      const close = Math.min(0.94, Math.max(0.06, open + (Math.random() - 0.46) * 0.12));
      const wick = Math.random() * 0.05;
      candles.push({
        open,
        close,
        high: Math.min(1, Math.max(open, close) + wick),
        low: Math.max(0, Math.min(open, close) - wick)
      });
      price = close;
    }
    return candles;
  }

  onMount(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let candles: Candle[] = [];
    let offset = 0;
    let frame = 0;
    let running = true;

    // Read the palette straight off the themed <html> element so the canvas
    // never drifts out of sync with the CSS variables.
    let palette = { node: '', link: '', up: '', down: '' };

    function readPalette() {
      const styles = getComputedStyle(document.documentElement);
      const isLight = document.documentElement.getAttribute('data-dash-theme') === 'light';
      palette = {
        node: isLight ? 'rgba(15, 18, 34, 0.30)' : 'rgba(255, 255, 255, 0.42)',
        link: isLight ? 'rgba(15, 18, 34, 0.10)' : 'rgba(255, 255, 255, 0.10)',
        up: styles.getPropertyValue('--d-buy').trim() || '#22c55e',
        down: styles.getPropertyValue('--d-sell').trim() || '#ef4444'
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = Array.from({ length: nodeCount(width, height) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.7
      }));

      candles = makeCandles(Math.ceil(width / CANDLE_WIDTH) + 3);
    }

    function drawCandles() {
      const baseline = height;
      const chartHeight = Math.min(height * 0.42, 320);
      const top = baseline - chartHeight;

      ctx!.globalAlpha = 0.16;

      for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        const x = i * CANDLE_WIDTH - offset;
        if (x < -CANDLE_WIDTH || x > width) continue;

        const bullish = candle.close >= candle.open;
        const color = bullish ? palette.up : palette.down;
        const yOf = (v: number) => top + (1 - v) * chartHeight;

        ctx!.strokeStyle = color;
        ctx!.fillStyle = color;
        ctx!.lineWidth = 1;

        // wick
        ctx!.beginPath();
        ctx!.moveTo(x + CANDLE_WIDTH / 2, yOf(candle.high));
        ctx!.lineTo(x + CANDLE_WIDTH / 2, yOf(candle.low));
        ctx!.stroke();

        // body
        const bodyTop = yOf(Math.max(candle.open, candle.close));
        const bodyHeight = Math.max(2, Math.abs(yOf(candle.open) - yOf(candle.close)));
        ctx!.fillRect(x + 5, bodyTop, CANDLE_WIDTH - 12, bodyHeight);
      }

      ctx!.globalAlpha = 1;
    }

    function drawMesh() {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > LINK_DISTANCE) continue;

          ctx!.globalAlpha = 1 - distance / LINK_DISTANCE;
          ctx!.strokeStyle = palette.link;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }

        ctx!.globalAlpha = 1;
        ctx!.fillStyle = palette.node;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      if (!running) return;

      ctx!.clearRect(0, 0, width, height);
      drawCandles();
      drawMesh();

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      offset += CANDLE_SPEED;
      if (offset >= CANDLE_WIDTH) {
        offset -= CANDLE_WIDTH;
        candles.shift();
        const previous = candles[candles.length - 1];
        const open = previous ? previous.close : 0.5;
        const close = Math.min(0.94, Math.max(0.06, open + (Math.random() - 0.46) * 0.12));
        const wick = Math.random() * 0.05;
        candles.push({
          open,
          close,
          high: Math.min(1, Math.max(open, close) + wick),
          low: Math.max(0, Math.min(open, close) - wick)
        });
      }

      frame = requestAnimationFrame(step);
    }

    function renderStatic() {
      ctx!.clearRect(0, 0, width, height);
      drawCandles();
      drawMesh();
    }

    function start() {
      cancelAnimationFrame(frame);
      if (reduceMotion.matches) {
        running = false;
        renderStatic();
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
      // Wait a tick so the attribute swap lands before the palette is read.
      requestAnimationFrame(() => {
        readPalette();
        if (!running) renderStatic();
      });
    });

    const observer = new ResizeObserver(() => {
      resize();
      if (!running) renderStatic();
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
  <!-- Static gradient wash and grid sit under the canvas. -->
  <div
    class="absolute inset-0"
    style="background:
      radial-gradient(ellipse 80% 50% at 50% -10%, var(--d-glow-a), transparent 60%),
      radial-gradient(ellipse 60% 50% at 85% 100%, var(--d-glow-b), transparent 60%);"
  />
  <div
    class="absolute inset-0 opacity-70"
    style="background-image:
      linear-gradient(var(--d-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--d-grid) 1px, transparent 1px);
      background-size: 64px 64px;
      mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%);"
  />
  <canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
</div>
