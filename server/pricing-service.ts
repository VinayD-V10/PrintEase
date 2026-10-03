import { PricingSettings, PrintOptions, PriceBreakdown } from '../src/types/printease';

/**
 * Helper to parse a page range string like "1, 2, 3, 5" or "1-3, 5"
 * Returns sorted unique array of 1-indexed page numbers capped at maxPages.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];
  const pages = new Set<number>();
  const tokens = rangeStr.split(/[\s,]+/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          if (i >= 1 && i <= maxPages) pages.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function calculateAuthoritativePrice(
  pageCount: number,
  options: PrintOptions,
  pricing: PricingSettings
): PriceBreakdown {
  const safePageCount = Math.max(1, Math.floor(pageCount || 1));
  const safeCopies = Math.max(1, Math.floor(options.copies || 1));

  // Determine rates based on paper size
  const colorRate = options.paper_size === 'A3' ? pricing.a3_color : pricing.a4_color;
  const bwRate = options.paper_size === 'A3' ? pricing.a3_bw : pricing.a4_bw;

  let ratePerPage = bwRate;
  let printingCost = 0;
  let colorPagesCount = 0;
  let bwPagesCount = safePageCount;

  if (options.color_type === 'COLOR') {
    ratePerPage = colorRate;
    colorPagesCount = safePageCount;
    bwPagesCount = 0;
    printingCost = safePageCount * safeCopies * colorRate;
  } else if (options.color_type === 'MIXED') {
    // Custom Page Color Split: e.g. "1, 2, 3, 5" in color, remaining in B&W
    const parsedColorPages = parsePageRange(options.custom_color_pages || '', safePageCount);
    colorPagesCount = parsedColorPages.length;
    bwPagesCount = Math.max(0, safePageCount - colorPagesCount);

    const perCopyPrintingCost = (colorPagesCount * colorRate) + (bwPagesCount * bwRate);
    printingCost = perCopyPrintingCost * safeCopies;
    ratePerPage = safePageCount > 0 ? Math.round((perCopyPrintingCost / safePageCount) * 100) / 100 : bwRate;
  } else {
    // Standard Black & White
    ratePerPage = bwRate;
    colorPagesCount = 0;
    bwPagesCount = safePageCount;
    printingCost = safePageCount * safeCopies * bwRate;
  }

  // Calculate paper sheets
  const sheetsPerCopy =
    options.side_type === 'DOUBLE'
      ? Math.ceil(safePageCount / 2)
      : safePageCount;
  const totalSheets = sheetsPerCopy * safeCopies;

  // Binding cost
  let bindingCost = 0;
  if (options.binding_type === 'SPIRAL') {
    bindingCost = pricing.spiral_binding * safeCopies;
  } else if (options.binding_type === 'STAPLE') {
    bindingCost = pricing.stapling * safeCopies;
  }

  // Lamination cost
  let laminationCost = 0;
  if (options.lamination) {
    laminationCost = pricing.lamination * safeCopies;
  }

  // Stapling cost
  const staplingCost = 0;

  // Urgency fee
  const urgencyCost = options.urgency === 'URGENT' ? pricing.urgent_fee : 0;

  // Delivery fee
  const deliveryCost = options.collection_type === 'DELIVERY' ? pricing.delivery_fee : 0;

  // Subtotal & Discount (5% bulk discount for orders over ₹300)
  const rawSubtotal = printingCost + bindingCost + laminationCost + staplingCost + urgencyCost + deliveryCost;
  let discount = 0;
  if (rawSubtotal >= 300) {
    discount = Math.round(rawSubtotal * 0.05);
  }

  const finalTotal = Math.max(1, rawSubtotal - discount);

  return {
    page_count: safePageCount,
    copies: safeCopies,
    sheets_per_copy: sheetsPerCopy,
    total_sheets: totalSheets,
    rate_per_page: ratePerPage,
    printing_cost: Math.round(printingCost * 100) / 100,
    color_pages_count: colorPagesCount,
    bw_pages_count: bwPagesCount,
    color_rate: colorRate,
    bw_rate: bwRate,
    binding_cost: Math.round(bindingCost * 100) / 100,
    lamination_cost: Math.round(laminationCost * 100) / 100,
    stapling_cost: Math.round(staplingCost * 100) / 100,
    urgency_cost: Math.round(urgencyCost * 100) / 100,
    delivery_cost: Math.round(deliveryCost * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    final_total: Math.round(finalTotal * 100) / 100,
    locked_at: new Date().toISOString(),
  };
}
