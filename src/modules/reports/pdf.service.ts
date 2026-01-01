import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { BasSummaryDto } from '../bas/dto/bas-summary.dto';
import { FYSummaryDto } from './dto/fy-summary.dto';
import { MoneyService } from '../../common/services/money.service';

/**
 * PDF layout configuration constants.
 * Centralized to avoid magic numbers.
 */
const PDF_CONFIG = {
  /** Page margins */
  margin: {
    left: 50,
    right: 50,
    top: 50,
    bottom: 50,
  },
  /** Font sizes */
  fontSize: {
    title: 24,
    subtitle: 16,
    heading: 14,
    body: 11,
    small: 9,
  },
  /** Colors */
  colors: {
    primary: '#2c3e50',
    secondary: '#7f8c8d',
    accent: '#3498db',
    border: '#bdc3c7',
    headerBg: '#ecf0f1',
  },
  /** Table configuration */
  table: {
    labelWidth: 250,
    valueWidth: 150,
    rowHeight: 25,
  },
} as const;

/**
 * Service for generating PDF reports.
 *
 * Uses PDFKit for lightweight, code-based PDF generation.
 * Supports BAS quarterly summaries and FY annual reports.
 *
 * @example
 * ```typescript
 * const pdfBuffer = await pdfService.generateBasPdf(basSummary);
 * res.set('Content-Type', 'application/pdf');
 * res.send(pdfBuffer);
 * ```
 */
@Injectable()
export class PdfService {
  constructor(private readonly moneyService: MoneyService) {}

  /**
   * Generates a BAS summary PDF document.
   *
   * @param summary - BAS summary data from BasService
   * @returns Buffer containing the PDF document
   */
  async generateBasPdf(summary: BasSummaryDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: PDF_CONFIG.margin.left,
        info: {
          Title: `BAS Summary ${summary.quarter} FY${summary.financialYear}`,
          Author: 'EasyTax-AU',
          Creator: 'EasyTax-AU PDF Generator',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.renderBasDocument(doc, summary);
        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Generates an FY summary PDF document.
   *
   * @param summary - FY summary data from ReportsService
   * @returns Buffer containing the PDF document
   */
  async generateFYPdf(summary: FYSummaryDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: PDF_CONFIG.margin.left,
        info: {
          Title: `Financial Year Summary FY${summary.financialYear}`,
          Author: 'EasyTax-AU',
          Creator: 'EasyTax-AU PDF Generator',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.renderFYDocument(doc, summary);
        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Renders the BAS summary document content.
   */
  private renderBasDocument(doc: PDFKit.PDFDocument, summary: BasSummaryDto): void {
    // Header
    this.renderHeader(doc, 'Business Activity Statement');
    this.renderSubtitle(
      doc,
      `${summary.quarter} FY${summary.financialYear} | ${this.formatDateRange(summary.periodStart, summary.periodEnd)}`,
    );

    doc.moveDown(2);

    // GST Summary Section
    this.renderSectionHeading(doc, 'GST Summary');

    const gstData = [
      { label: 'G1 - Total Sales (including GST)', value: summary.g1TotalSalesCents },
      { label: '1A - GST Collected on Sales', value: summary.label1aGstCollectedCents },
      { label: '1B - GST Paid on Purchases', value: summary.label1bGstPaidCents },
    ];

    this.renderDataTable(doc, gstData);

    doc.moveDown(1);

    // Net GST Section (highlighted)
    const netLabel =
      summary.netGstPayableCents >= 0 ? 'Net GST Payable to ATO' : 'Net GST Refund Due';

    this.renderHighlightedRow(doc, netLabel, summary.netGstPayableCents);

    doc.moveDown(2);

    // Record Counts Section
    this.renderSectionHeading(doc, 'Record Summary');

    const countData = [
      { label: 'Income Records', value: summary.incomeCount, isCurrency: false },
      { label: 'Expense Records', value: summary.expenseCount, isCurrency: false },
    ];

    this.renderDataTable(doc, countData);

    // Footer
    this.renderFooter(doc);
  }

  /**
   * Renders the FY summary document content.
   */
  private renderFYDocument(doc: PDFKit.PDFDocument, summary: FYSummaryDto): void {
    // Header
    this.renderHeader(doc, 'Financial Year Summary');
    this.renderSubtitle(
      doc,
      `${summary.fyLabel} | ${this.formatDateRange(summary.periodStart, summary.periodEnd)}`,
    );

    doc.moveDown(2);

    // Income Section
    this.renderSectionHeading(doc, 'Income Summary');

    const incomeData = [
      { label: 'Total Income (including GST)', value: summary.income.totalIncomeCents },
      { label: 'Paid Invoices', value: summary.income.paidIncomeCents },
      { label: 'Unpaid Invoices', value: summary.income.unpaidIncomeCents },
      { label: 'GST Collected', value: summary.income.gstCollectedCents },
      { label: 'Invoice Count', value: summary.income.count, isCurrency: false },
    ];

    this.renderDataTable(doc, incomeData);

    doc.moveDown(2);

    // Expenses Section
    this.renderSectionHeading(doc, 'Expense Summary');

    const expenseData = [
      { label: 'Total Expenses', value: summary.expenses.totalExpensesCents },
      { label: 'GST Paid (Claimable)', value: summary.expenses.gstPaidCents },
      { label: 'Expense Count', value: summary.expenses.count, isCurrency: false },
    ];

    this.renderDataTable(doc, expenseData);

    doc.moveDown(2);

    // Expenses by Category
    if (summary.expenses.byCategory && summary.expenses.byCategory.length > 0) {
      this.renderSectionHeading(doc, 'Expenses by Category');

      const categoryData = summary.expenses.byCategory.map((cat) => ({
        label: `${cat.name} (${cat.basLabel})`,
        value: cat.totalCents,
      }));

      this.renderDataTable(doc, categoryData);

      doc.moveDown(2);
    }

    // Net Position Section (highlighted)
    this.renderSectionHeading(doc, 'Net Position');

    const netProfitLabel = summary.netProfitCents >= 0 ? 'Net Profit' : 'Net Loss';

    this.renderHighlightedRow(doc, netProfitLabel, summary.netProfitCents);

    doc.moveDown(0.5);

    const netGstLabel = summary.netGstPayableCents >= 0 ? 'Net GST Payable' : 'Net GST Refund Due';

    this.renderHighlightedRow(doc, netGstLabel, summary.netGstPayableCents);

    // Footer
    this.renderFooter(doc);
  }

  /**
   * Renders the document header.
   */
  private renderHeader(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fillColor(PDF_CONFIG.colors.primary)
      .fontSize(PDF_CONFIG.fontSize.title)
      .font('Helvetica-Bold')
      .text(title, { align: 'center' });
  }

  /**
   * Renders a subtitle below the header.
   */
  private renderSubtitle(doc: PDFKit.PDFDocument, text: string): void {
    doc
      .fillColor(PDF_CONFIG.colors.secondary)
      .fontSize(PDF_CONFIG.fontSize.subtitle)
      .font('Helvetica')
      .text(text, { align: 'center' });
  }

  /**
   * Renders a section heading.
   */
  private renderSectionHeading(doc: PDFKit.PDFDocument, text: string): void {
    doc
      .fillColor(PDF_CONFIG.colors.primary)
      .fontSize(PDF_CONFIG.fontSize.heading)
      .font('Helvetica-Bold')
      .text(text);

    // Underline
    const y = doc.y;
    doc
      .strokeColor(PDF_CONFIG.colors.accent)
      .lineWidth(2)
      .moveTo(PDF_CONFIG.margin.left, y)
      .lineTo(PDF_CONFIG.margin.left + 100, y)
      .stroke();

    doc.moveDown(0.5);
  }

  /**
   * Renders a data table with label-value pairs.
   */
  private renderDataTable(
    doc: PDFKit.PDFDocument,
    data: Array<{ label: string; value: number; isCurrency?: boolean }>,
  ): void {
    const startX = PDF_CONFIG.margin.left;
    const { labelWidth, valueWidth, rowHeight } = PDF_CONFIG.table;

    data.forEach((row, index) => {
      const y = doc.y;
      const isCurrency = row.isCurrency !== false;

      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(startX, y, labelWidth + valueWidth, rowHeight)
          .fillColor(PDF_CONFIG.colors.headerBg)
          .fill();
      }

      // Label
      doc
        .fillColor(PDF_CONFIG.colors.primary)
        .fontSize(PDF_CONFIG.fontSize.body)
        .font('Helvetica')
        .text(row.label, startX + 5, y + 7, {
          width: labelWidth - 10,
        });

      // Value
      const displayValue = isCurrency ? this.formatCurrency(row.value) : row.value.toLocaleString();

      doc
        .fillColor(PDF_CONFIG.colors.primary)
        .fontSize(PDF_CONFIG.fontSize.body)
        .font('Helvetica-Bold')
        .text(displayValue, startX + labelWidth, y + 7, {
          width: valueWidth - 10,
          align: 'right',
        });

      doc.y = y + rowHeight;
    });
  }

  /**
   * Renders a highlighted summary row.
   */
  private renderHighlightedRow(doc: PDFKit.PDFDocument, label: string, valueCents: number): void {
    const startX = PDF_CONFIG.margin.left;
    const { labelWidth, valueWidth, rowHeight } = PDF_CONFIG.table;
    const y = doc.y;

    // Background
    doc
      .rect(startX, y, labelWidth + valueWidth, rowHeight + 5)
      .fillColor(PDF_CONFIG.colors.accent)
      .fill();

    // Label
    doc
      .fillColor('#ffffff')
      .fontSize(PDF_CONFIG.fontSize.body)
      .font('Helvetica-Bold')
      .text(label, startX + 5, y + 9, {
        width: labelWidth - 10,
      });

    // Value
    doc
      .fillColor('#ffffff')
      .fontSize(PDF_CONFIG.fontSize.body)
      .font('Helvetica-Bold')
      .text(this.formatCurrency(valueCents), startX + labelWidth, y + 9, {
        width: valueWidth - 10,
        align: 'right',
      });

    doc.y = y + rowHeight + 10;
  }

  /**
   * Renders the document footer.
   */
  private renderFooter(doc: PDFKit.PDFDocument): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - PDF_CONFIG.margin.bottom - 30;

    doc
      .fillColor(PDF_CONFIG.colors.secondary)
      .fontSize(PDF_CONFIG.fontSize.small)
      .font('Helvetica')
      .text(
        `Generated by EasyTax-AU on ${new Date().toLocaleDateString('en-AU')}`,
        PDF_CONFIG.margin.left,
        footerY,
        {
          align: 'center',
          width: doc.page.width - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right,
        },
      )
      .text(
        'This document is for record-keeping purposes only. Verify figures before ATO submission.',
        {
          align: 'center',
          width: doc.page.width - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right,
        },
      );
  }

  /**
   * Formats cents as Australian currency string.
   *
   * @param cents - Amount in cents
   * @returns Formatted string like "$1,234.56"
   */
  private formatCurrency(cents: number): string {
    const dollars = Math.abs(cents) / 100;
    const formatted = dollars.toLocaleString('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const prefix = cents < 0 ? '-$' : '$';
    return `${prefix}${formatted}`;
  }

  /**
   * Formats a date range string.
   *
   * @param start - Start date ISO string
   * @param end - End date ISO string
   * @returns Formatted range like "1 Jul 2025 - 30 Jun 2026"
   */
  private formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    return `${startDate.toLocaleDateString('en-AU', options)} - ${endDate.toLocaleDateString('en-AU', options)}`;
  }
}
