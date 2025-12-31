import { Test, TestingModule } from '@nestjs/testing';
import { CsvParserService } from './csv-parser.service';
import { CsvColumnMapping } from './csv-import.types';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvParserService],
    }).compile();

    service = module.get<CsvParserService>(CsvParserService);
  });

  describe('parseCurrency', () => {
    it('should parse simple dollar amount', () => {
      expect(service.parseCurrency('$100.00')).toBe(10000);
    });

    it('should parse amount without dollar sign', () => {
      expect(service.parseCurrency('100.00')).toBe(10000);
    });

    it('should parse amount with commas', () => {
      expect(service.parseCurrency('$1,234.56')).toBe(123456);
    });

    it('should parse large amounts', () => {
      expect(service.parseCurrency('$12,345,678.90')).toBe(1234567890);
    });

    it('should parse negative amounts with minus', () => {
      expect(service.parseCurrency('-$50.00')).toBe(-5000);
    });

    it('should parse negative amounts with parentheses', () => {
      expect(service.parseCurrency('($50.00)')).toBe(-5000);
    });

    it('should handle zero', () => {
      expect(service.parseCurrency('$0.00')).toBe(0);
      expect(service.parseCurrency('0')).toBe(0);
    });

    it('should handle cents only', () => {
      expect(service.parseCurrency('$0.99')).toBe(99);
    });

    it('should handle whole dollars', () => {
      expect(service.parseCurrency('$100')).toBe(10000);
    });

    it('should return null for empty string', () => {
      expect(service.parseCurrency('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(service.parseCurrency('   ')).toBeNull();
    });

    it('should handle various currency symbols', () => {
      expect(service.parseCurrency('£100.00')).toBe(10000);
      expect(service.parseCurrency('€100.00')).toBe(10000);
    });

    it('should round to nearest cent (banker rounding)', () => {
      // 100.005 -> 10001 cents
      expect(service.parseCurrency('100.005')).toBe(10001);
      // 100.004 -> 10000 cents
      expect(service.parseCurrency('100.004')).toBe(10000);
    });
  });

  describe('parseDate', () => {
    it('should parse ISO format (YYYY-MM-DD)', () => {
      const result = service.parseDate('2025-07-15');
      expect(result).toEqual(new Date(2025, 6, 15));
    });

    it('should parse Australian format (DD/MM/YYYY)', () => {
      const result = service.parseDate('15/07/2025');
      expect(result).toEqual(new Date(2025, 6, 15));
    });

    it('should parse short date format (D/M/YYYY)', () => {
      const result = service.parseDate('5/7/2025');
      expect(result).toEqual(new Date(2025, 6, 5));
    });

    it('should parse DD-MM-YYYY format', () => {
      const result = service.parseDate('15-07-2025');
      expect(result).toEqual(new Date(2025, 6, 15));
    });

    it('should return null for empty string', () => {
      expect(service.parseDate('')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(service.parseDate('July 15, 2025')).toBeNull();
      expect(service.parseDate('invalid')).toBeNull();
    });

    it('should handle whitespace', () => {
      const result = service.parseDate('  2025-07-15  ');
      expect(result).toEqual(new Date(2025, 6, 15));
    });
  });

  describe('parsePercentage', () => {
    it('should parse whole number', () => {
      expect(service.parsePercentage('50')).toBe(50);
    });

    it('should parse with percent sign', () => {
      expect(service.parsePercentage('50%')).toBe(50);
    });

    it('should parse decimal as percentage (0.5 = 50%)', () => {
      expect(service.parsePercentage('0.5')).toBe(50);
    });

    it('should clamp to 100 max', () => {
      expect(service.parsePercentage('150')).toBe(100);
    });

    it('should clamp to 0 min', () => {
      expect(service.parsePercentage('-50')).toBe(0);
    });

    it('should default to 100 for empty', () => {
      expect(service.parsePercentage('')).toBe(100);
    });

    it('should round to integer', () => {
      expect(service.parsePercentage('50.6')).toBe(51);
    });
  });

  describe('parseString', () => {
    const customMapping: CsvColumnMapping = {
      date: 'Date',
      item: 'Item',
      total: 'Total',
      gst: 'GST',
      bizPercent: 'Biz%',
      category: 'Category',
    };

    it('should parse a simple CSV', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
2025-07-15,Internet,$88.00,$8.00,50,Office
2025-07-16,GitHub,$21.99,$0.00,100,Software`;

      const results = service.parseString(csv, customMapping);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        rowNumber: 1,
        date: new Date(2025, 6, 15),
        itemName: 'Internet',
        totalCents: 8800,
        gstCents: 800,
        bizPercent: 50,
        categoryName: 'Office',
        description: undefined,
      });
      expect(results[1]).toEqual({
        rowNumber: 2,
        date: new Date(2025, 6, 16),
        itemName: 'GitHub',
        totalCents: 2199,
        gstCents: 0,
        bizPercent: 100,
        categoryName: 'Software',
        description: undefined,
      });
    });

    it('should skip rows without required fields', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
2025-07-15,Internet,$88.00,$8.00,50,Office
,,,,
2025-07-16,GitHub,$21.99,$0.00,100,Software`;

      const results = service.parseString(csv, customMapping);
      expect(results).toHaveLength(2);
    });

    it('should skip total/summary rows', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
2025-07-15,Internet,$88.00,$8.00,50,Office
2025-07-16,Total,$109.99,$8.00,100,
2025-07-16,GitHub,$21.99,$0.00,100,Software`;

      const results = service.parseString(csv, customMapping);
      expect(results).toHaveLength(2);
      expect(results.every((r) => !r.itemName.includes('Total'))).toBe(true);
    });

    it('should handle missing optional columns', () => {
      const simpleMapping: CsvColumnMapping = {
        date: 'Date',
        item: 'Item',
        total: 'Total',
      };

      const csv = `Date,Item,Total
2025-07-15,Internet,$88.00`;

      const results = service.parseString(csv, simpleMapping);

      expect(results).toHaveLength(1);
      expect(results[0].gstCents).toBe(0);
      expect(results[0].bizPercent).toBe(100);
      expect(results[0].categoryName).toBeUndefined();
    });

    it('should handle Australian date format', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
15/07/2025,Internet,$88.00,$8.00,50,Office`;

      const results = service.parseString(csv, customMapping);
      expect(results[0].date).toEqual(new Date(2025, 6, 15));
    });

    it('should trim whitespace from values', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
2025-07-15,  Internet  ,  $88.00  ,  $8.00  ,  50  ,  Office  `;

      const results = service.parseString(csv, customMapping);
      expect(results[0].itemName).toBe('Internet');
      expect(results[0].categoryName).toBe('Office');
    });

    it('should skip rows with invalid dates', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
invalid-date,Internet,$88.00,$8.00,50,Office
2025-07-16,GitHub,$21.99,$0.00,100,Software`;

      const results = service.parseString(csv, customMapping);
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('GitHub');
    });

    it('should skip rows with zero or negative totals', () => {
      const csv = `Date,Item,Total,GST,Biz%,Category
2025-07-15,Refund,-$88.00,-$8.00,100,Office
2025-07-16,GitHub,$21.99,$0.00,100,Software`;

      const results = service.parseString(csv, customMapping);
      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('GitHub');
    });

    it('should handle CSV with description column', () => {
      const mappingWithDesc: CsvColumnMapping = {
        date: 'Date',
        item: 'Vendor',
        total: 'Amount',
        description: 'Notes',
      };

      const csv = `Date,Vendor,Amount,Notes
2025-07-15,Amazon,$50.00,Office supplies`;

      const results = service.parseString(csv, mappingWithDesc);
      expect(results[0].description).toBe('Office supplies');
    });
  });

  describe('parseBuffer', () => {
    it('should parse buffer correctly', () => {
      const mapping: CsvColumnMapping = {
        date: 'Date',
        item: 'Item',
        total: 'Total',
      };

      const csv = `Date,Item,Total
2025-07-15,Internet,$88.00`;

      const buffer = Buffer.from(csv, 'utf-8');
      const results = service.parseBuffer(buffer, mapping);

      expect(results).toHaveLength(1);
      expect(results[0].itemName).toBe('Internet');
    });
  });

  describe('extractHeaders', () => {
    it('should extract headers from CSV', () => {
      const csv = `Date,Item,Total,GST
2025-07-15,Internet,$88.00,$8.00`;

      const headers = service.extractHeaders(csv);
      expect(headers).toEqual(['Date', 'Item', 'Total', 'GST']);
    });

    it('should return empty array for empty content', () => {
      expect(service.extractHeaders('')).toEqual([]);
    });
  });

  describe('detectMapping', () => {
    it('should detect standard column names', () => {
      const headers = ['Date', 'Item', 'Total', 'GST', 'Category'];
      const mapping = service.detectMapping(headers);

      expect(mapping).toEqual({
        date: 'Date',
        item: 'Item',
        total: 'Total',
        gst: 'GST',
        bizPercent: undefined,
        category: 'Category',
      });
    });

    it('should detect alternative column names', () => {
      const headers = ['Transaction Date', 'Description', 'Amount', 'Tax'];
      const mapping = service.detectMapping(headers);

      expect(mapping).not.toBeNull();
      expect(mapping?.date).toBe('Transaction Date');
      expect(mapping?.item).toBe('Description');
      expect(mapping?.total).toBe('Amount');
      expect(mapping?.gst).toBe('Tax');
    });

    it('should return null if required columns missing', () => {
      const headers = ['Item', 'Total'];
      const mapping = service.detectMapping(headers);

      expect(mapping).toBeNull();
    });

    it('should be case insensitive', () => {
      const headers = ['DATE', 'ITEM', 'TOTAL'];
      const mapping = service.detectMapping(headers);

      expect(mapping).not.toBeNull();
    });

    it('should detect Biz% column variations', () => {
      const headers = ['Date', 'Item', 'Total', 'Business Use'];
      const mapping = service.detectMapping(headers);

      expect(mapping?.bizPercent).toBe('Business Use');
    });
  });

  describe('getMapping', () => {
    it('should return custom mapping', () => {
      const mapping = service.getMapping('custom');
      expect(mapping).toBeDefined();
      expect(mapping?.date).toBe('Date');
    });

    it('should return commbank mapping', () => {
      const mapping = service.getMapping('commbank');
      expect(mapping).toBeDefined();
      expect(mapping?.date).toBe('Date');
    });

    it('should return amex mapping', () => {
      const mapping = service.getMapping('amex');
      expect(mapping).toBeDefined();
    });

    it('should be case insensitive', () => {
      expect(service.getMapping('CUSTOM')).toBeDefined();
      expect(service.getMapping('CommBank')).toBeDefined();
    });

    it('should return undefined for unknown source', () => {
      expect(service.getMapping('unknown')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    const mapping: CsvColumnMapping = {
      date: 'Date',
      item: 'Item',
      total: 'Total',
    };

    it('should handle empty CSV', () => {
      const csv = '';
      const results = service.parseString(csv, mapping);
      expect(results).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'Date,Item,Total';
      const results = service.parseString(csv, mapping);
      expect(results).toHaveLength(0);
    });

    it('should handle CSV with extra columns', () => {
      const csv = `Date,Item,Total,Extra1,Extra2
2025-07-15,Internet,$88.00,foo,bar`;

      const results = service.parseString(csv, mapping);
      expect(results).toHaveLength(1);
    });

    it('should handle relax column count (inconsistent columns)', () => {
      const csv = `Date,Item,Total
2025-07-15,Internet,$88.00,extra
2025-07-16,GitHub,$21.99`;

      const results = service.parseString(csv, mapping);
      expect(results).toHaveLength(2);
    });

    it('should handle Unicode characters in item names', () => {
      const csv = `Date,Item,Total
2025-07-15,Café Supplies,$50.00
2025-07-16,日本語,¥1000`;

      const results = service.parseString(csv, mapping);
      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('Café Supplies');
      expect(results[1].itemName).toBe('日本語');
    });

    it('should handle quoted fields with commas', () => {
      const csv = `Date,Item,Total
2025-07-15,"Internet, Phone Bundle",$88.00`;

      const results = service.parseString(csv, mapping);
      expect(results[0].itemName).toBe('Internet, Phone Bundle');
    });
  });
});
