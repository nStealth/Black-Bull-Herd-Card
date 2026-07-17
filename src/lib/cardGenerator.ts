// Herd Card Generator - Canvas-based PNG export
// Generates 1024x1024 NFT-style cards with HUD overlay

import type { Tier } from './tiers';
import { formatBalance, shortAddress, getRankTier } from './tiers';

export interface CardData {
  wallet: string;
  balance: number;
  tier: Tier;
  percentSupply: number;
}

const CANVAS_SIZE = 1024;

// Image cache for card backgrounds
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load an image from a path with caching
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Return a placeholder if image fails to load
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Create a gradient background based on tier
 */
function createGradientBackground(
  ctx: CanvasRenderingContext2D,
  tier: Tier
): void {
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  switch (tier.id) {
    case 'common':
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#2d2d2d');
      break;
    case 'rare':
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e3a5f');
      break;
    case 'epic':
      gradient.addColorStop(0, '#1a0a2e');
      gradient.addColorStop(1, '#2d1b4e');
      break;
    case 'legendary':
      gradient.addColorStop(0, '#1a1200');
      gradient.addColorStop(1, '#3d2800');
      break;
    case 'mythic':
      gradient.addColorStop(0, '#1a0505');
      gradient.addColorStop(1, '#3d0a0a');
      break;
    default:
      gradient.addColorStop(0, '#0a0a0f');
      gradient.addColorStop(1, '#1a1a25');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

/**
 * Draw the tier-colored border frame
 */
function drawBorder(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const borderWidth = 8;
  const cornerRadius = 40;
  
  ctx.strokeStyle = tier.color;
  ctx.lineWidth = borderWidth;
  ctx.shadowColor = tier.glowColor;
  ctx.shadowBlur = 30;
  
  ctx.beginPath();
  ctx.roundRect(borderWidth / 2, borderWidth / 2, CANVAS_SIZE - borderWidth, CANVAS_SIZE - borderWidth, cornerRadius);
  ctx.stroke();
  
  // Reset shadow
  ctx.shadowBlur = 0;
}

/**
 * Draw inner decorative border
 */
function drawInnerBorder(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const inset = 24;
  const borderWidth = 2;
  
  ctx.strokeStyle = `${tier.color}40`; // 25% opacity
  ctx.lineWidth = borderWidth;
  
  ctx.beginPath();
  ctx.roundRect(inset, inset, CANVAS_SIZE - inset * 2, CANVAS_SIZE - inset * 2, 24);
  ctx.stroke();
}

/**
 * Draw chevron divider
 */
function drawChevronDivider(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const y = CANVAS_SIZE * 0.62;
  const centerX = CANVAS_SIZE / 2;
  const width = 120;
  const height = 8;
  
  // Gold gradient for the chevron
  const gradient = ctx.createLinearGradient(centerX - width, 0, centerX + width, 0);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.3, tier.color);
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(0.7, tier.color);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(centerX - width, y);
  ctx.lineTo(centerX, y - height);
  ctx.lineTo(centerX + width, y);
  ctx.lineTo(centerX + width - 20, y);
  ctx.lineTo(centerX, y - height + 4);
  ctx.lineTo(centerX - width + 20, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw text scrim (gradient overlay for readability)
 */
function drawTextScrim(ctx: CanvasRenderingContext2D): void {
  const scrimHeight = CANVAS_SIZE * 0.45;
  const startY = CANVAS_SIZE - scrimHeight;
  
  const gradient = ctx.createLinearGradient(0, startY, 0, CANVAS_SIZE);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, startY, CANVAS_SIZE, scrimHeight);
}

/**
 * Draw tier badge
 */
function drawTierBadge(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const centerX = CANVAS_SIZE / 2;
  const y = CANVAS_SIZE * 0.68;
  const paddingX = 40;
  const paddingY = 12;
  
  ctx.font = 'bold 36px Arial, sans-serif';
  const textWidth = ctx.measureText(tier.name.toUpperCase()).width;
  
  // Badge background
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 52;
  const badgeX = centerX - badgeWidth / 2;
  
  // Rounded rectangle for badge
  ctx.fillStyle = `${tier.color}30`;
  ctx.strokeStyle = tier.color;
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.roundRect(badgeX, y - badgeHeight / 2, badgeWidth, badgeHeight, 26);
  ctx.fill();
  ctx.stroke();
  
  // Badge text
  ctx.fillStyle = tier.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tier.name.toUpperCase(), centerX, y);
}

/**
 * Draw wallet address
 */
function drawWalletAddress(ctx: CanvasRenderingContext2D, wallet: string): void {
  const centerX = CANVAS_SIZE / 2;
  const y = CANVAS_SIZE * 0.76;
  
  const shortWallet = shortAddress(wallet);
  
  ctx.font = '28px monospace';
  ctx.fillStyle = '#a0a0b0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shortWallet, centerX, y);
}

/**
 * Draw balance
 */
function drawBalance(ctx: CanvasRenderingContext2D, balance: number): void {
  const centerX = CANVAS_SIZE / 2;
  const y = CANVAS_SIZE * 0.82;
  
  const formattedBalance = formatBalance(balance);
  
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add glow effect for balance
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  ctx.fillText(formattedBalance, centerX, y);
  ctx.shadowBlur = 0;
  
  // "$ANSEM" label
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = '#606070';
  ctx.fillText('$ANSEM', centerX, y + 36);
}

/**
 * Draw percentage of supply
 */
function drawPercentSupply(ctx: CanvasRenderingContext2D, percent: number): void {
  const leftX = 60;
  const y = CANVAS_SIZE * 0.92;
  
  ctx.font = '22px Arial, sans-serif';
  ctx.fillStyle = '#808090';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${percent.toFixed(4)}% of supply`, leftX, y);
}

/**
 * Draw rank
 */
function drawRank(ctx: CanvasRenderingContext2D, percent: number): void {
  const rightX = CANVAS_SIZE - 60;
  const y = CANVAS_SIZE * 0.92;
  const rank = getRankTier(percent);
  
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank, rightX, y);
}

/**
 * Draw "CHARGE FORWARD" branding
 */
function drawBranding(ctx: CanvasRenderingContext2D): void {
  const y = 50;
  const centerX = CANVAS_SIZE / 2;
  
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.3;
  ctx.fillText('CHARGE FORWARD', centerX, y);
  ctx.globalAlpha = 1;
}

/**
 * Draw tier indicator dots
 */
function drawTierDots(ctx: CanvasRenderingContext2D, tier: Tier): void {
  const tiers = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const currentIndex = tiers.indexOf(tier.id);
  const dotSize = 10;
  const spacing = 20;
  const totalWidth = (tiers.length - 1) * spacing;
  const startX = (CANVAS_SIZE - totalWidth) / 2;
  const y = 80;
  
  tiers.forEach((t, i) => {
    const x = startX + i * spacing;
    const isActive = i <= currentIndex;
    const tierColor = getTierColor(t);
    
    ctx.beginPath();
    ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
    
    if (isActive) {
      ctx.fillStyle = tierColor;
      ctx.shadowColor = tierColor;
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#333333';
      ctx.shadowBlur = 0;
    }
    
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function getTierColor(tierId: string): string {
  const colors: Record<string, string> = {
    common: '#8b8b8b',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444'
  };
  return colors[tierId] || '#ffffff';
}

/**
 * Main card render function
 */
export async function renderHerdCard(data: CardData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Create gradient background
  createGradientBackground(ctx, data.tier);
  
  // Try to load and draw card image
  try {
    const img = await loadImage(data.tier.cardPath);
    
    // Calculate cover sizing to fill the canvas
    const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (CANVAS_SIZE - scaledWidth) / 2;
    const y = (CANVAS_SIZE - scaledHeight) / 2;
    
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    // Add subtle darkening overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } catch {
    // Use gradient background only if image fails
    console.warn('Card image not found, using gradient background');
  }
  
  // Draw decorative elements
  drawBorder(ctx, data.tier);
  drawInnerBorder(ctx, data.tier);
  
  // Draw text overlay
  drawTextScrim(ctx);
  drawTierDots(ctx, data.tier);
  drawBranding(ctx);
  drawTierBadge(ctx, data.tier);
  drawChevronDivider(ctx, data.tier);
  drawWalletAddress(ctx, data.wallet);
  drawBalance(ctx, data.balance);
  drawPercentSupply(ctx, data.percentSupply);
  drawRank(ctx, data.percentSupply);
  
  // Return as data URL
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generate a simple card without async (fallback)
 */
export function renderSimpleCard(data: CardData): string {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Background
  createGradientBackground(ctx, data.tier);
  
  // Borders
  drawBorder(ctx, data.tier);
  drawInnerBorder(ctx, data.tier);
  
  // Text overlay
  drawTextScrim(ctx);
  drawTierDots(ctx, data.tier);
  drawBranding(ctx);
  drawTierBadge(ctx, data.tier);
  drawChevronDivider(ctx, data.tier);
  drawWalletAddress(ctx, data.wallet);
  drawBalance(ctx, data.balance);
  drawPercentSupply(ctx, data.percentSupply);
  drawRank(ctx, data.percentSupply);
  
  return canvas.toDataURL('image/png', 1.0);
}
