import { FYService } from './fy.service';

describe('FYService', () => {
  let service: FYService;

  beforeEach(() => {
    service = new FYService();
  });

  describe('getFYFromDate', () => {
    describe('boundary cases - FY transition at July 1', () => {
      it('should return FY2025 for June 30, 2025 (last day of FY2025)', () => {
        const date = new Date('2025-06-30');
        expect(service.getFYFromDate(date)).toBe(2025);
      });

      it('should return FY2026 for July 1, 2025 (first day of FY2026)', () => {
        const date = new Date('2025-07-01');
        expect(service.getFYFromDate(date)).toBe(2026);
      });

      it('should return FY2026 for June 30, 2026 (last day of FY2026)', () => {
        const date = new Date('2026-06-30');
        expect(service.getFYFromDate(date)).toBe(2026);
      });

      it('should return FY2027 for July 1, 2026 (first day of FY2027)', () => {
        const date = new Date('2026-07-01');
        expect(service.getFYFromDate(date)).toBe(2027);
      });
    });

    describe('mid-year dates', () => {
      it('should return FY2026 for August 2025', () => {
        const date = new Date('2025-08-15');
        expect(service.getFYFromDate(date)).toBe(2026);
      });

      it('should return FY2026 for December 2025', () => {
        const date = new Date('2025-12-25');
        expect(service.getFYFromDate(date)).toBe(2026);
      });

      it('should return FY2026 for January 2026', () => {
        const date = new Date('2026-01-15');
        expect(service.getFYFromDate(date)).toBe(2026);
      });

      it('should return FY2026 for April 2026', () => {
        const date = new Date('2026-04-01');
        expect(service.getFYFromDate(date)).toBe(2026);
      });
    });

    describe('string input (TypeORM date columns)', () => {
      it('should handle ISO date strings', () => {
        expect(service.getFYFromDate('2025-07-01')).toBe(2026);
        expect(service.getFYFromDate('2025-06-30')).toBe(2025);
      });

      it('should handle date strings from TypeORM', () => {
        // TypeORM returns date columns as strings in format YYYY-MM-DD
        expect(service.getFYFromDate('2026-01-15')).toBe(2026);
      });
    });
  });

  describe('getQuarterFromDate', () => {
    describe('Q1 - July to September', () => {
      it('should return Q1 for July 1', () => {
        expect(service.getQuarterFromDate(new Date('2025-07-01'))).toBe('Q1');
      });

      it('should return Q1 for July 15', () => {
        expect(service.getQuarterFromDate(new Date('2025-07-15'))).toBe('Q1');
      });

      it('should return Q1 for August', () => {
        expect(service.getQuarterFromDate(new Date('2025-08-20'))).toBe('Q1');
      });

      it('should return Q1 for September 30', () => {
        expect(service.getQuarterFromDate(new Date('2025-09-30'))).toBe('Q1');
      });
    });

    describe('Q2 - October to December', () => {
      it('should return Q2 for October 1', () => {
        expect(service.getQuarterFromDate(new Date('2025-10-01'))).toBe('Q2');
      });

      it('should return Q2 for November', () => {
        expect(service.getQuarterFromDate(new Date('2025-11-15'))).toBe('Q2');
      });

      it('should return Q2 for December 31', () => {
        expect(service.getQuarterFromDate(new Date('2025-12-31'))).toBe('Q2');
      });
    });

    describe('Q3 - January to March', () => {
      it('should return Q3 for January 1', () => {
        expect(service.getQuarterFromDate(new Date('2026-01-01'))).toBe('Q3');
      });

      it('should return Q3 for February', () => {
        expect(service.getQuarterFromDate(new Date('2026-02-14'))).toBe('Q3');
      });

      it('should return Q3 for March 31', () => {
        expect(service.getQuarterFromDate(new Date('2026-03-31'))).toBe('Q3');
      });
    });

    describe('Q4 - April to June', () => {
      it('should return Q4 for April 1', () => {
        expect(service.getQuarterFromDate(new Date('2026-04-01'))).toBe('Q4');
      });

      it('should return Q4 for May', () => {
        expect(service.getQuarterFromDate(new Date('2026-05-15'))).toBe('Q4');
      });

      it('should return Q4 for June 30', () => {
        expect(service.getQuarterFromDate(new Date('2026-06-30'))).toBe('Q4');
      });
    });
  });

  describe('getFYInfo', () => {
    it('should return complete FY info for Q1 date', () => {
      const result = service.getFYInfo(new Date('2025-08-15'));
      expect(result).toEqual({
        financialYear: 2026,
        quarter: 'Q1',
        fyLabel: 'FY2026',
        quarterLabel: 'Q1 FY2026',
      });
    });

    it('should return complete FY info for Q2 date', () => {
      const result = service.getFYInfo(new Date('2025-11-20'));
      expect(result).toEqual({
        financialYear: 2026,
        quarter: 'Q2',
        fyLabel: 'FY2026',
        quarterLabel: 'Q2 FY2026',
      });
    });

    it('should return complete FY info for Q3 date', () => {
      const result = service.getFYInfo(new Date('2026-02-15'));
      expect(result).toEqual({
        financialYear: 2026,
        quarter: 'Q3',
        fyLabel: 'FY2026',
        quarterLabel: 'Q3 FY2026',
      });
    });

    it('should return complete FY info for Q4 date', () => {
      const result = service.getFYInfo(new Date('2026-05-01'));
      expect(result).toEqual({
        financialYear: 2026,
        quarter: 'Q4',
        fyLabel: 'FY2026',
        quarterLabel: 'Q4 FY2026',
      });
    });

    it('should handle year boundary (Q3 is in next calendar year)', () => {
      const result = service.getFYInfo(new Date('2026-01-31'));
      expect(result.financialYear).toBe(2026);
      expect(result.quarter).toBe('Q3');
    });
  });

  describe('getQuarterDateRange', () => {
    describe('Q1 date ranges', () => {
      it('should return correct Q1 range for FY2026', () => {
        const range = service.getQuarterDateRange('Q1', 2026);
        expect(range.startDate).toEqual(new Date(2025, 6, 1)); // July 1, 2025
        expect(range.endDate).toEqual(new Date(2025, 8, 30)); // September 30, 2025
      });
    });

    describe('Q2 date ranges', () => {
      it('should return correct Q2 range for FY2026', () => {
        const range = service.getQuarterDateRange('Q2', 2026);
        expect(range.startDate).toEqual(new Date(2025, 9, 1)); // October 1, 2025
        expect(range.endDate).toEqual(new Date(2025, 11, 31)); // December 31, 2025
      });
    });

    describe('Q3 date ranges', () => {
      it('should return correct Q3 range for FY2026', () => {
        const range = service.getQuarterDateRange('Q3', 2026);
        expect(range.startDate).toEqual(new Date(2026, 0, 1)); // January 1, 2026
        expect(range.endDate).toEqual(new Date(2026, 2, 31)); // March 31, 2026
      });
    });

    describe('Q4 date ranges', () => {
      it('should return correct Q4 range for FY2026', () => {
        const range = service.getQuarterDateRange('Q4', 2026);
        expect(range.startDate).toEqual(new Date(2026, 3, 1)); // April 1, 2026
        expect(range.endDate).toEqual(new Date(2026, 5, 30)); // June 30, 2026
      });
    });

    describe('different FY years', () => {
      it('should handle FY2025 correctly', () => {
        const q1Range = service.getQuarterDateRange('Q1', 2025);
        expect(q1Range.startDate).toEqual(new Date(2024, 6, 1)); // July 1, 2024

        const q4Range = service.getQuarterDateRange('Q4', 2025);
        expect(q4Range.endDate).toEqual(new Date(2025, 5, 30)); // June 30, 2025
      });
    });
  });

  describe('isDateInQuarter', () => {
    it('should return true for date within Q1', () => {
      const date = new Date(2025, 7, 15); // August 15, 2025 (local time)
      expect(service.isDateInQuarter(date, 'Q1', 2026)).toBe(true);
    });

    it('should return false for date outside Q1', () => {
      const date = new Date(2025, 9, 15); // October 15, 2025
      expect(service.isDateInQuarter(date, 'Q1', 2026)).toBe(false);
    });

    it('should return true for start boundary', () => {
      const date = new Date(2025, 6, 1); // July 1, 2025
      expect(service.isDateInQuarter(date, 'Q1', 2026)).toBe(true);
    });

    it('should return true for end boundary', () => {
      const date = new Date(2025, 8, 30); // September 30, 2025
      expect(service.isDateInQuarter(date, 'Q1', 2026)).toBe(true);
    });

    it('should handle Q3 crossing calendar year', () => {
      const date = new Date(2026, 1, 28); // February 28, 2026
      expect(service.isDateInQuarter(date, 'Q3', 2026)).toBe(true);
    });
  });

  describe('getAllQuartersForFY', () => {
    it('should return all 4 quarters for a FY', () => {
      const quarters = service.getAllQuartersForFY(2026);
      expect(quarters).toHaveLength(4);
      expect(quarters.map((q) => q.quarter)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    });

    it('should return correct ranges for all quarters', () => {
      const quarters = service.getAllQuartersForFY(2026);

      // Q1
      expect(quarters[0].range.startDate).toEqual(new Date(2025, 6, 1));
      expect(quarters[0].range.endDate).toEqual(new Date(2025, 8, 30));

      // Q4
      expect(quarters[3].range.startDate).toEqual(new Date(2026, 3, 1));
      expect(quarters[3].range.endDate).toEqual(new Date(2026, 5, 30));
    });
  });

  describe('getCurrentFYInfo', () => {
    it('should return FY info for current date', () => {
      const result = service.getCurrentFYInfo();

      // Just verify it returns valid structure
      expect(result).toHaveProperty('financialYear');
      expect(result).toHaveProperty('quarter');
      expect(result).toHaveProperty('fyLabel');
      expect(result).toHaveProperty('quarterLabel');
      expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(result.quarter);
      expect(result.fyLabel).toMatch(/^FY\d{4}$/);
    });
  });

  describe('real-world scenarios', () => {
    it('should correctly identify BAS due dates', () => {
      // Q1 FY2026 BAS due 28 October 2025
      const q1End = new Date('2025-09-30');
      const fyInfo = service.getFYInfo(q1End);
      expect(fyInfo.quarter).toBe('Q1');
      expect(fyInfo.financialYear).toBe(2026);
    });

    it('should handle tax time (end of FY)', () => {
      // June 30 is end of FY
      const eofy = new Date('2026-06-30');
      const fyInfo = service.getFYInfo(eofy);
      expect(fyInfo.quarter).toBe('Q4');
      expect(fyInfo.financialYear).toBe(2026);
    });

    it('should handle new FY start', () => {
      // July 1 is start of new FY
      const newFyStart = new Date('2026-07-01');
      const fyInfo = service.getFYInfo(newFyStart);
      expect(fyInfo.quarter).toBe('Q1');
      expect(fyInfo.financialYear).toBe(2027);
    });
  });
});
