import type { FYInfo } from '@/lib/fy';
import { getFYInfo } from '@/lib/fy';

export function useFYInfo(date: Date = new Date()): FYInfo {
  return getFYInfo(date);
}
