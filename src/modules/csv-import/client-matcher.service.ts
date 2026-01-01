import { Injectable } from '@nestjs/common';
import { ClientMatch } from './csv-import.types';

/**
 * Cached client info for in-memory matching.
 * Since client names are encrypted in DB, we load all clients
 * and match in memory after decryption.
 */
export interface CachedClient {
  /** Client UUID */
  id: string;
  /** Decrypted client name */
  name: string;
  /** Normalized name for comparison */
  normalizedName: string;
}

/**
 * Service for fuzzy matching client names from CSV imports.
 *
 * Since client names are encrypted at rest, we cannot perform
 * SQL-based fuzzy matching. Instead, we load all clients into
 * memory (after TypeORM decrypts them) and match in-memory.
 *
 * This approach works well for personal use (small client count).
 */
@Injectable()
export class ClientMatcherService {
  /**
   * Find the best matching client from a list of cached clients.
   *
   * @param clientName - The client name from CSV
   * @param cachedClients - List of clients with decrypted names
   * @param threshold - Minimum similarity score (0-1), default 0.6
   * @returns Best match or null if no good match found
   */
  findBestMatch(
    clientName: string,
    cachedClients: CachedClient[],
    threshold = 0.6,
  ): ClientMatch | null {
    const normalizedInput = this.normalize(clientName);

    if (!normalizedInput || cachedClients.length === 0) {
      return null;
    }

    // First, check for exact match (case-insensitive)
    const exactMatch = cachedClients.find((c) => c.normalizedName === normalizedInput);
    if (exactMatch) {
      return {
        clientId: exactMatch.id,
        clientName: exactMatch.name,
        score: 1.0,
        matchType: 'exact',
      };
    }

    // Check for partial match (input contains client name or vice versa)
    // Only match if the contained string is at least 3 chars to avoid false positives
    const partialMatch = cachedClients.find((c) => {
      const clientLen = c.normalizedName.length;
      const inputLen = normalizedInput.length;

      // Require minimum 3 chars to match
      if (clientLen < 3 || inputLen < 3) {
        return false;
      }

      // Check if one contains the other
      return (
        normalizedInput.includes(c.normalizedName) || c.normalizedName.includes(normalizedInput)
      );
    });

    if (partialMatch) {
      // Calculate score based on overlap
      const shorter = Math.min(normalizedInput.length, partialMatch.normalizedName.length);
      const longer = Math.max(normalizedInput.length, partialMatch.normalizedName.length);
      const overlapScore = shorter / longer;

      // For partial matches, use a high score since we have a substring match
      return {
        clientId: partialMatch.id,
        clientName: partialMatch.name,
        score: Math.min(0.95, 0.8 + overlapScore * 0.15),
        matchType: 'partial',
      };
    }

    // Fall back to fuzzy matching using Levenshtein distance
    let bestMatch: ClientMatch | null = null;
    let bestScore = 0;

    for (const client of cachedClients) {
      const score = this.calculateSimilarity(normalizedInput, client.normalizedName);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = {
          clientId: client.id,
          clientName: client.name,
          score,
          matchType: 'fuzzy',
        };
      }
    }

    return bestMatch;
  }

  /**
   * Prepare clients for matching by pre-computing normalized names.
   *
   * @param clients - Array of clients with id and name
   * @returns Array of cached clients with normalized names
   */
  prepareClientsForMatching(clients: Array<{ id: string; name: string }>): CachedClient[] {
    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      normalizedName: this.normalize(client.name),
    }));
  }

  /**
   * Normalize a string for comparison.
   * - Convert to lowercase
   * - Remove common business suffixes (PTY LTD, INC, etc.)
   * - Remove special characters
   * - Trim whitespace
   */
  normalize(value: string): string {
    return value
      .toLowerCase()
      .replace(/\bpty\.?\s*ltd\.?\b/gi, '')
      .replace(/\binc\.?\b/gi, '')
      .replace(/\bllc\.?\b/gi, '')
      .replace(/\bltd\.?\b/gi, '')
      .replace(/\bcorporation\b/gi, '')
      .replace(/\bcorp\.?\b/gi, '')
      .replace(/\bcompany\b/gi, '')
      .replace(/\bco\.?\b/gi, '')
      .replace(/\baustralia\b/gi, '')
      .replace(/\bau\b/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity score using Levenshtein distance.
   * Returns a value between 0 (no match) and 1 (perfect match).
   */
  calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings.
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // Initialize first column
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
