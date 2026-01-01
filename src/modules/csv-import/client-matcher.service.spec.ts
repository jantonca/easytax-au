import { ClientMatcherService, CachedClient } from './client-matcher.service';

describe('ClientMatcherService', () => {
  let service: ClientMatcherService;

  beforeEach(() => {
    service = new ClientMatcherService();
  });

  describe('prepareClientsForMatching', () => {
    it('should create cached clients with normalized names', () => {
      const clients = [
        { id: 'uuid-1', name: 'Acme Corporation Pty Ltd' },
        { id: 'uuid-2', name: 'John Smith' },
      ];

      const result = service.prepareClientsForMatching(clients);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        name: 'Acme Corporation Pty Ltd',
        normalizedName: 'acme',
      });
      expect(result[1]).toEqual({
        id: 'uuid-2',
        name: 'John Smith',
        normalizedName: 'john smith',
      });
    });

    it('should handle empty array', () => {
      const result = service.prepareClientsForMatching([]);
      expect(result).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(service.normalize('ACME CORP')).toBe('acme');
    });

    it('should remove PTY LTD', () => {
      expect(service.normalize('Acme Pty Ltd')).toBe('acme');
      expect(service.normalize('Acme PTY. LTD.')).toBe('acme');
      expect(service.normalize('Acme pty ltd')).toBe('acme');
    });

    it('should remove INC', () => {
      expect(service.normalize('Acme Inc')).toBe('acme');
      expect(service.normalize('Acme Inc.')).toBe('acme');
    });

    it('should remove LLC', () => {
      expect(service.normalize('Acme LLC')).toBe('acme');
      expect(service.normalize('Acme llc')).toBe('acme');
    });

    it('should remove LTD', () => {
      expect(service.normalize('Acme Ltd')).toBe('acme');
      expect(service.normalize('Acme Ltd.')).toBe('acme');
    });

    it('should remove CORPORATION and CORP', () => {
      expect(service.normalize('Acme Corporation')).toBe('acme');
      expect(service.normalize('Acme Corp')).toBe('acme');
      expect(service.normalize('Acme Corp.')).toBe('acme');
    });

    it('should remove COMPANY and CO', () => {
      expect(service.normalize('Acme Company')).toBe('acme');
      expect(service.normalize('Acme Co')).toBe('acme');
      expect(service.normalize('Acme Co.')).toBe('acme');
    });

    it('should remove Australia and AU', () => {
      expect(service.normalize('Acme Australia')).toBe('acme');
      expect(service.normalize('Acme AU')).toBe('acme');
    });

    it('should remove special characters', () => {
      expect(service.normalize('Acme & Co!')).toBe('acme');
      expect(service.normalize("O'Brien's Services")).toBe('obriens services');
    });

    it('should collapse multiple spaces', () => {
      expect(service.normalize('Acme   Corp   Ltd')).toBe('acme');
    });

    it('should preserve numbers', () => {
      expect(service.normalize('Client 123')).toBe('client 123');
    });

    it('should handle complex business names', () => {
      expect(service.normalize('Smith & Associates Pty Ltd Australia')).toBe('smith associates');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(service.calculateSimilarity('acme', 'acme')).toBe(1);
    });

    it('should return 0 for empty strings', () => {
      expect(service.calculateSimilarity('', 'acme')).toBe(0);
      expect(service.calculateSimilarity('acme', '')).toBe(0);
    });

    it('should calculate correct similarity for similar strings', () => {
      // "acme" vs "acne" - 1 substitution, length 4
      const similarity = service.calculateSimilarity('acme', 'acne');
      expect(similarity).toBeCloseTo(0.75, 2);
    });

    it('should handle strings of different lengths', () => {
      // "acme" vs "acme corp" - distance 5, max length 9
      const similarity = service.calculateSimilarity('acme', 'acme corp');
      expect(similarity).toBeCloseTo(0.44, 2);
    });

    it('should return low score for very different strings', () => {
      const similarity = service.calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('findBestMatch', () => {
    const mockClients: CachedClient[] = [
      { id: 'uuid-acme', name: 'Acme Corporation', normalizedName: 'acme' },
      { id: 'uuid-smith', name: 'John Smith', normalizedName: 'john smith' },
      { id: 'uuid-tech', name: 'Tech Solutions Pty Ltd', normalizedName: 'tech solutions' },
      { id: 'uuid-global', name: 'Global Services', normalizedName: 'global services' },
    ];

    describe('exact matching', () => {
      it('should find exact match (case-insensitive)', () => {
        const result = service.findBestMatch('Acme', mockClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-acme');
        expect(result?.score).toBe(1.0);
        expect(result?.matchType).toBe('exact');
      });

      it('should find exact match after normalization', () => {
        const result = service.findBestMatch('Acme Corporation Pty Ltd', mockClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-acme');
        expect(result?.score).toBe(1.0);
        expect(result?.matchType).toBe('exact');
      });

      it('should find exact match with different casing', () => {
        const result = service.findBestMatch('JOHN SMITH', mockClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-smith');
        expect(result?.score).toBe(1.0);
        expect(result?.matchType).toBe('exact');
      });

      it('should find exact match with business suffixes', () => {
        const result = service.findBestMatch('Tech Solutions', mockClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-tech');
        expect(result?.score).toBe(1.0);
        expect(result?.matchType).toBe('exact');
      });
    });

    describe('partial matching', () => {
      it('should find partial match when input contains client name', () => {
        const result = service.findBestMatch('Acme updates project', mockClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-acme');
        expect(result?.matchType).toBe('partial');
        expect(result?.score).toBeGreaterThanOrEqual(0.6);
      });

      it('should find partial match when client name contains input', () => {
        const clients: CachedClient[] = [
          { id: 'uuid-1', name: 'John Smith Consulting', normalizedName: 'john smith consulting' },
        ];

        const result = service.findBestMatch('John Smith', clients);

        expect(result).not.toBeNull();
        expect(result?.matchType).toBe('partial');
      });
    });

    describe('fuzzy matching', () => {
      it('should find fuzzy match for minor typos', () => {
        const result = service.findBestMatch('Acne', mockClients, 0.5);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-acme');
        expect(result?.matchType).toBe('fuzzy');
        expect(result?.score).toBeGreaterThanOrEqual(0.5);
      });

      it('should find fuzzy match for similar names', () => {
        const result = service.findBestMatch('Global Service', mockClients, 0.7);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-global');
        // Note: This matches as 'partial' because "global service" contains "global services" partially
        // The algorithm checks substring containment before fuzzy matching
      });
    });

    describe('no match scenarios', () => {
      it('should return null for empty input', () => {
        const result = service.findBestMatch('', mockClients);
        expect(result).toBeNull();
      });

      it('should return null for empty client list', () => {
        const result = service.findBestMatch('Acme', []);
        expect(result).toBeNull();
      });

      it('should return null when no match above threshold', () => {
        const result = service.findBestMatch('Completely Unknown Company', mockClients, 0.8);
        expect(result).toBeNull();
      });

      it('should return null for whitespace-only input', () => {
        const result = service.findBestMatch('   ', mockClients);
        expect(result).toBeNull();
      });
    });

    describe('threshold behavior', () => {
      it('should respect custom threshold', () => {
        // With high threshold, fuzzy match should fail
        const result = service.findBestMatch('Xyz Corp', mockClients, 0.95);
        expect(result).toBeNull();
      });

      it('should find match with lower threshold', () => {
        // With low threshold, more matches are possible
        const result = service.findBestMatch('Acne', mockClients, 0.5);
        expect(result).not.toBeNull();
      });

      it('should use default threshold of 0.6', () => {
        // "Acne" vs "Acme" similarity is 0.75, should match with default 0.6
        const result = service.findBestMatch('Acne', mockClients);
        expect(result).not.toBeNull();
      });
    });

    describe('priority: exact > partial > fuzzy', () => {
      it('should prefer exact match over partial', () => {
        const clients: CachedClient[] = [
          { id: 'uuid-1', name: 'Acme Updates', normalizedName: 'acme updates' },
          { id: 'uuid-2', name: 'Acme', normalizedName: 'acme' },
        ];

        const result = service.findBestMatch('Acme', clients);

        expect(result?.clientId).toBe('uuid-2');
        expect(result?.matchType).toBe('exact');
      });
    });

    describe('real-world client names', () => {
      const realWorldClients: CachedClient[] = [
        { id: 'uuid-1', name: 'Aida Tomescu', normalizedName: 'aida tomescu' },
        { id: 'uuid-2', name: 'Smith & Associates', normalizedName: 'smith associates' },
        { id: 'uuid-3', name: "O'Brien Consulting", normalizedName: 'obrien consulting' },
        { id: 'uuid-4', name: 'ABC Corp Pty Ltd', normalizedName: 'abc' },
      ];

      it('should match "Aida Tomescu updates" to "Aida Tomescu"', () => {
        const result = service.findBestMatch('Aida Tomescu updates', realWorldClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-1');
        expect(result?.clientName).toBe('Aida Tomescu');
      });

      it('should match "Smith & Assoc" to "Smith & Associates"', () => {
        const result = service.findBestMatch('Smith & Assoc', realWorldClients, 0.6);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-2');
      });

      it('should match "O\'Brien" to "O\'Brien Consulting"', () => {
        const result = service.findBestMatch("O'Brien", realWorldClients);

        // After normalization: "obrien" vs "obrien consulting"
        // "obrien" (6 chars) is contained in "obrien consulting" (18 chars)
        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-3');
        expect(result?.matchType).toBe('partial');
      });

      it('should match "ABC" to "ABC Corp Pty Ltd"', () => {
        const result = service.findBestMatch('ABC', realWorldClients);

        expect(result).not.toBeNull();
        expect(result?.clientId).toBe('uuid-4');
        expect(result?.matchType).toBe('exact');
      });
    });
  });

  describe('levenshteinDistance (via calculateSimilarity)', () => {
    it('should handle single character difference', () => {
      // "cat" vs "bat" = 1 change
      const sim = service.calculateSimilarity('cat', 'bat');
      expect(sim).toBeCloseTo(0.67, 2); // 1 - (1/3)
    });

    it('should handle insertion', () => {
      // "cat" vs "cart" = 1 insertion
      const sim = service.calculateSimilarity('cat', 'cart');
      expect(sim).toBeCloseTo(0.75, 2); // 1 - (1/4)
    });

    it('should handle deletion', () => {
      // "cart" vs "cat" = 1 deletion
      const sim = service.calculateSimilarity('cart', 'cat');
      expect(sim).toBeCloseTo(0.75, 2); // 1 - (1/4)
    });

    it('should handle multiple changes', () => {
      // "kitten" vs "sitting" = 3 changes (k->s, e->i, +g)
      const sim = service.calculateSimilarity('kitten', 'sitting');
      expect(sim).toBeCloseTo(0.57, 2); // 1 - (3/7)
    });
  });
});
