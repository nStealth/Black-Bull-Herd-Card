// Tier configuration for Black Bull Herd Card
// $ANSEM Token: 9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump

export const ANSEM_MINT = '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';

// Total supply: 1,000,000,000 (1B)
export const TOTAL_SUPPLY = 1_000_000_000;

export interface Tier {
  id: string;
  name: string;
  minBalance: number;
  color: string;
  glowColor: string;
  textColor: string;
  cardPath: string;
  description: string;
}

export const TIERS: Tier[] = [
  {
    id: 'common',
    name: 'Recruit Bull',
    minBalance: 1,
    color: '#8b8b8b',
    glowColor: 'rgba(139, 139, 139, 0.3)',
    textColor: '#ffffff',
    cardPath: '/cards/common/1.webp',
    description: 'Every holder counts'
  },
  {
    id: 'rare',
    name: 'Iron Bull',
    minBalance: 100_000,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    textColor: '#ffffff',
    cardPath: '/cards/rare/1.webp',
    description: 'Strong herd presence'
  },
  {
    id: 'epic',
    name: 'Gold Bull',
    minBalance: 1_000_000,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    textColor: '#ffffff',
    cardPath: '/cards/epic/1.webp',
    description: 'Dominant force'
  },
  {
    id: 'legendary',
    name: 'Legendary Bull',
    minBalance: 10_000_000,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    textColor: '#000000',
    cardPath: '/cards/legendary/1.webp',
    description: 'Elite Alpha'
  },
  {
    id: 'mythic',
    name: 'Black God Bull',
    minBalance: 50_000_000,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    textColor: '#ffffff',
    cardPath: '/cards/mythic/1.webp',
    description: 'The One Above All'
  }
];

export interface TierResult {
  tier: Tier;
  percentSupply: number;
}

export function getTier(balance: number): TierResult {
  // Sort tiers from highest to lowest
  const sortedTiers = [...TIERS].sort((a, b) => b.minBalance - a.minBalance);
  
  // Find the highest tier the user qualifies for
  const tier = sortedTiers.find(t => balance >= t.minBalance) || TIERS[0];
  
  // Calculate percentage of total supply
  const percentSupply = (balance / TOTAL_SUPPLY) * 100;
  
  return { tier, percentSupply };
}

export function formatBalance(balance: number): string {
  if (balance >= 1_000_000_000) {
    return (balance / 1_000_000_000).toFixed(2) + 'B';
  }
  if (balance >= 1_000_000) {
    return (balance / 1_000_000).toFixed(2) + 'M';
  }
  if (balance >= 1_000) {
    return (balance / 1_000).toFixed(2) + 'K';
  }
  return balance.toLocaleString();
}

export function shortAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getRankTier(percentSupply: number): string {
  if (percentSupply >= 10) return 'Top 100';
  if (percentSupply >= 1) return 'Top 1,000';
  if (percentSupply >= 0.1) return 'Top 10,000';
  if (percentSupply >= 0.01) return 'Top 50,000';
  return 'Herd Member';
}
