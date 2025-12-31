import { Injectable } from '@nestjs/common';

/**
 * Service for fuzzy matching provider names from CSV imports.
 * Uses normalized string comparison and common alias matching.
 */
@Injectable()
export class ProviderMatcherService {
  /**
   * Common aliases for known providers.
   * Maps normalized alias -> canonical provider name.
   */
  private readonly PROVIDER_ALIASES: Record<string, string> = {
    // Internet providers
    telstra: 'Telstra',
    iinet: 'iiNet',
    'ii net': 'iiNet',
    optus: 'Optus',
    tpg: 'TPG',
    aussie: 'Aussie Broadband',
    'aussie broadband': 'Aussie Broadband',

    // Cloud/Tech
    google: 'Google',
    'google cloud': 'Google Cloud',
    'google ads': 'Google Ads',
    aws: 'AWS',
    amazon: 'Amazon',
    'amazon web services': 'AWS',
    azure: 'Microsoft Azure',
    microsoft: 'Microsoft',
    github: 'GitHub',
    gitlab: 'GitLab',
    digitalocean: 'DigitalOcean',
    'digital ocean': 'DigitalOcean',
    netlify: 'Netlify',
    vercel: 'Vercel',
    heroku: 'Heroku',
    cloudflare: 'Cloudflare',

    // Software/Subscriptions
    adobe: 'Adobe',
    zoom: 'Zoom',
    slack: 'Slack',
    notion: 'Notion',
    dropbox: 'Dropbox',
    figma: 'Figma',
    canva: 'Canva',
    netflix: 'Netflix',
    spotify: 'Spotify',
    jetbrains: 'JetBrains',

    // Office
    officeworks: 'Officeworks',
    bunnings: 'Bunnings',
    ikea: 'IKEA',

    // Fuel
    bp: 'BP',
    shell: 'Shell',
    caltex: 'Caltex',
    ampol: 'Ampol',
    '7eleven': '7-Eleven',
    '7-eleven': '7-Eleven',
  };

  /**
   * Find the best matching provider from a list of known providers.
   *
   * @param itemName - The item/vendor name from CSV
   * @param knownProviders - List of known provider names from database
   * @param threshold - Minimum similarity score (0-1), default 0.6
   * @returns Best match or null if no good match found
   */
  findBestMatch(itemName: string, knownProviders: string[], threshold = 0.6): ProviderMatch | null {
    const normalizedItem = this.normalize(itemName);

    // First, check for exact alias match
    const aliasMatch = this.PROVIDER_ALIASES[normalizedItem];
    if (aliasMatch) {
      const exactProvider = knownProviders.find(
        (p) => this.normalize(p) === this.normalize(aliasMatch),
      );
      if (exactProvider) {
        return {
          providerName: exactProvider,
          score: 1.0,
          matchType: 'alias',
        };
      }
    }

    // Then, check for exact match in known providers
    const exactMatch = knownProviders.find((p) => this.normalize(p) === normalizedItem);
    if (exactMatch) {
      return {
        providerName: exactMatch,
        score: 1.0,
        matchType: 'exact',
      };
    }

    // Check for contains match (provider name contained in item)
    const containsMatch = knownProviders.find((p) => normalizedItem.includes(this.normalize(p)));
    if (containsMatch) {
      return {
        providerName: containsMatch,
        score: 0.9,
        matchType: 'contains',
      };
    }

    // Check for starts-with match
    const startsWithMatch = knownProviders.find((p) =>
      normalizedItem.startsWith(this.normalize(p)),
    );
    if (startsWithMatch) {
      return {
        providerName: startsWithMatch,
        score: 0.85,
        matchType: 'startsWith',
      };
    }

    // Fall back to fuzzy matching using Levenshtein distance
    let bestMatch: ProviderMatch | null = null;
    let bestScore = 0;

    for (const provider of knownProviders) {
      const score = this.calculateSimilarity(normalizedItem, this.normalize(provider));
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = {
          providerName: provider,
          score,
          matchType: 'fuzzy',
        };
      }
    }

    return bestMatch;
  }

  /**
   * Normalize a string for comparison.
   * - Convert to lowercase
   * - Remove common suffixes (PTY LTD, INC, etc.)
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

  /**
   * Extract keywords from item name for category matching.
   */
  extractKeywords(itemName: string): string[] {
    const normalized = itemName.toLowerCase();
    const keywords: string[] = [];

    // Tech/Software keywords
    if (/cloud|aws|azure|hosting|server/.test(normalized)) {
      keywords.push('hosting', 'cloud');
    }
    if (/software|app|subscription|saas/.test(normalized)) {
      keywords.push('software');
    }
    if (/internet|broadband|nbn|wifi/.test(normalized)) {
      keywords.push('internet');
    }
    if (/phone|mobile|telstra|optus/.test(normalized)) {
      keywords.push('phone');
    }

    // Office keywords
    if (/office|stationery|supplies/.test(normalized)) {
      keywords.push('office');
    }
    if (/furniture|desk|chair/.test(normalized)) {
      keywords.push('furniture');
    }

    // Vehicle keywords
    if (/fuel|petrol|diesel|bp|shell|caltex/.test(normalized)) {
      keywords.push('fuel', 'vehicle');
    }
    if (/car|vehicle|rego|insurance/.test(normalized)) {
      keywords.push('vehicle');
    }

    // Professional services
    if (/accountant|bookkeep|tax/.test(normalized)) {
      keywords.push('accounting');
    }
    if (/legal|lawyer|solicitor/.test(normalized)) {
      keywords.push('legal');
    }

    return [...new Set(keywords)];
  }
}

/**
 * Result of a provider match operation.
 */
export interface ProviderMatch {
  /** The matched provider name */
  providerName: string;
  /** Confidence score (0-1) */
  score: number;
  /** How the match was determined */
  matchType: 'exact' | 'alias' | 'contains' | 'startsWith' | 'fuzzy';
}
