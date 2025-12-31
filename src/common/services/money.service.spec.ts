import { MoneyService } from './money.service';

describe('MoneyService', () => {
  let service: MoneyService;

  beforeEach(() => {
    service = new MoneyService();
  });

  describe('addAmounts', () => {
    it('should add two amounts in cents', () => {
      expect(service.addAmounts(100000, 10000)).toBe(110000); // $1000 + $100 = $1100
    });

    it('should handle zero amounts', () => {
      expect(service.addAmounts(0, 0)).toBe(0);
      expect(service.addAmounts(10000, 0)).toBe(10000);
      expect(service.addAmounts(0, 10000)).toBe(10000);
    });

    it('should handle large amounts', () => {
      expect(service.addAmounts(500000000, 50000000)).toBe(550000000); // $5M + $500K
    });
  });

  describe('addGst', () => {
    it('should add 10% GST to subtotal', () => {
      expect(service.addGst(10000)).toBe(11000); // $100 → $110
    });

    it('should handle zero amount', () => {
      expect(service.addGst(0)).toBe(0);
    });

    it('should round correctly', () => {
      // $33.33 + 10% = $36.663 → $36.66 = 3666 cents
      expect(service.addGst(3333)).toBe(3666);
    });

    it('should handle small amounts', () => {
      expect(service.addGst(1)).toBe(1); // 1 cent + 0.1 = 1.1 → 1 cent (rounded)
    });

    it('should handle large amounts', () => {
      expect(service.addGst(100000000)).toBe(110000000); // $1,000,000
    });
  });

  describe('calcGstFromTotal', () => {
    it('should extract GST from GST-inclusive total', () => {
      expect(service.calcGstFromTotal(11000)).toBe(1000); // $110 → GST = $10
    });

    it('should handle zero amount', () => {
      expect(service.calcGstFromTotal(0)).toBe(0);
    });

    it('should round correctly', () => {
      // $100 / 11 = $9.0909... → 909 cents
      expect(service.calcGstFromTotal(10000)).toBe(909);
    });

    it('should handle exact divisibility', () => {
      // $11.00 / 11 = $1.00 exactly
      expect(service.calcGstFromTotal(1100)).toBe(100);
    });
  });

  describe('calcSubtotalFromTotal', () => {
    it('should extract subtotal from GST-inclusive total', () => {
      expect(service.calcSubtotalFromTotal(11000)).toBe(10000); // $110 → $100
    });

    it('should handle zero amount', () => {
      expect(service.calcSubtotalFromTotal(0)).toBe(0);
    });
  });

  describe('applyBizPercent', () => {
    it('should apply 50% business use', () => {
      expect(service.applyBizPercent(10000, 50)).toBe(5000);
    });

    it('should apply 100% business use', () => {
      expect(service.applyBizPercent(10000, 100)).toBe(10000);
    });

    it('should apply 0% business use', () => {
      expect(service.applyBizPercent(10000, 0)).toBe(0);
    });

    it('should handle fractional percentages', () => {
      // $100 at 33.33% = $33.33 = 3333 cents
      expect(service.applyBizPercent(10000, 33.33)).toBe(3333);
    });

    it('should throw for negative percentage', () => {
      expect(() => service.applyBizPercent(10000, -1)).toThrow(
        'Business percentage must be between 0 and 100',
      );
    });

    it('should throw for percentage over 100', () => {
      expect(() => service.applyBizPercent(10000, 101)).toThrow(
        'Business percentage must be between 0 and 100',
      );
    });

    it('should handle zero amount', () => {
      expect(service.applyBizPercent(0, 50)).toBe(0);
    });
  });

  describe('calcDeductibleGst', () => {
    it('should calculate deductible GST at 100%', () => {
      expect(service.calcDeductibleGst(1000, 100)).toBe(1000);
    });

    it('should calculate deductible GST at 50%', () => {
      expect(service.calcDeductibleGst(1000, 50)).toBe(500);
    });

    it('should calculate deductible GST at 0%', () => {
      expect(service.calcDeductibleGst(1000, 0)).toBe(0);
    });
  });

  describe('formatCents', () => {
    it('should format cents to dollar string', () => {
      expect(service.formatCents(10000)).toBe('$100.00');
    });

    it('should handle cents portion', () => {
      expect(service.formatCents(10050)).toBe('$100.50');
    });

    it('should handle zero', () => {
      expect(service.formatCents(0)).toBe('$0.00');
    });

    it('should handle small amounts', () => {
      expect(service.formatCents(5)).toBe('$0.05');
    });
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents', () => {
      expect(service.dollarsToCents(100.5)).toBe(10050);
    });

    it('should handle string input', () => {
      expect(service.dollarsToCents('100.50')).toBe(10050);
    });

    it('should handle whole dollars', () => {
      expect(service.dollarsToCents(100)).toBe(10000);
    });

    it('should round floating point precision issues', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      expect(service.dollarsToCents(0.1 + 0.2)).toBe(30);
    });

    it('should handle zero', () => {
      expect(service.dollarsToCents(0)).toBe(0);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to Decimal dollars', () => {
      const result = service.centsToDollars(10050);
      expect(result.toNumber()).toBe(100.5);
    });

    it('should handle zero', () => {
      const result = service.centsToDollars(0);
      expect(result.toNumber()).toBe(0);
    });
  });

  describe('edge cases and precision', () => {
    it('should handle the classic 0.1 + 0.2 problem', () => {
      // This would fail with native JS: (0.1 + 0.2) * 100 !== 30
      const cents = service.dollarsToCents(0.1 + 0.2);
      expect(cents).toBe(30);
    });

    it('should maintain precision through multiple operations', () => {
      const subtotal = 9999; // $99.99
      const withGst = service.addGst(subtotal);
      const extractedGst = service.calcGstFromTotal(withGst);
      const extractedSubtotal = service.calcSubtotalFromTotal(withGst);

      // Values should be consistent
      expect(extractedSubtotal + extractedGst).toBe(withGst);
    });
  });
});
