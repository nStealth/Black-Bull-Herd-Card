import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines clsx and tailwind-merge for clean conditional class merging.
 * Usage: cn('base-class', condition && 'conditional', ['array', 'of', 'classes'])
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
