import { PricingSettings, PrintOptions, PriceBreakdown } from '../src/types/printease';

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  a4_bw: 1.0,
  a4_color: 5.0,
  a3_bw: 3.0,
  a3_color: 10.0,
  spiral_binding: 30.0,
  stapling: 5.0,
  lamination: 10.0,
  urgent_fee: 20.0,
  delivery_fee: 40.0,
};

/**
 * Server-authoritative price calculator
 * Never trusts prices computed by the frontend client.
 */
export function calculateOrderPrice(
  pageCount: number,
  options: PrintOptions,
  pricing: PricingSettings = DEFAULT_PRICING_SETTINGS
): PriceBreakdown {
  const safePages = Math.max(1, pageCount);
  const copies = Math.max(1, options.copies || 1);
  const isDuplex = options.side_type === 'DOUBLE';

  // Calculate paper sheets
  const sheetsPerCopy = isDuplex ? Math.ceil(safePages / 2) : safePages;
  const totalSheets = sheetsPerCopy * copies;

  // Rates per page based on paper size and color type
  const isA3 = options.paper_size === 'A3';
  const bwRate = isA3 ? pricing.a3_bw : pricing.a4_bw;
  const colorRate = isA3 ? pricing.a3_color : pricing.a4_color;

  let printingCost = 0;
  let colorPagesCount = 0;
  let bwPagesCount = 0;
  let baseRate = bwRate;

  if (options.color_type === 'COLOR') {
    baseRate = colorRate;
    colorPagesCount = safePages;
    printingCost = safePages * colorRate * copies;
  } else if (options.color_type === 'MIXED') {
    // Parse custom color pages if provided
    colorPagesCount = options.color_pages_count || 0;
    if (options.custom_color_pages && !colorPagesCount) {
      const parts = options.custom_color_pages
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);
      colorPagesCount = Math.min(parts.length, safePages);
    }
    bwPagesCount = Math.max(0, safePages - colorPagesCount);
    printingCost = (colorPagesCount * colorRate + bwPagesCount * bwRate) * copies;
  } else {
    // Default B&W
    baseRate = bwRate;
    bwPagesCount = safePages;
    printingCost = safePages * bwRate * copies;
  }

  // Finishing & binding costs
  let bindingCost = 0;
  if (options.binding_type === 'SPIRAL') {
    bindingCost = pricing.spiral_binding * copies;
  }

  let staplingCost = 0;
  if (options.binding_type === 'STAPLE') {
    staplingCost = pricing.stapling * copies;
  }

  let laminationCost = 0;
  if (options.lamination) {
    laminationCost = pricing.lamination * copies;
  }

  // Service options
  let urgencyCost = 0;
  if (options.urgency === 'URGENT') {
    urgencyCost = pricing.urgent_fee;
  }

  let deliveryCost = 0;
  if (options.collection_type === 'DELIVERY') {
    deliveryCost = pricing.delivery_fee;
  }

  const finalTotal = Math.round(
    (printingCost + bindingCost + staplingCost + laminationCost + urgencyCost + deliveryCost) * 100
  ) / 100;

  return {
    page_count: safePages,
    copies,
    sheets_per_copy: sheetsPerCopy,
    total_sheets: totalSheets,
    rate_per_page: baseRate,
    printing_cost: Math.round(printingCost * 100) / 100,
    color_pages_count: colorPagesCount,
    bw_pages_count: bwPagesCount,
    color_rate: colorRate,
    bw_rate: bwRate,
    binding_cost: bindingCost,
    lamination_cost: laminationCost,
    stapling_cost: staplingCost,
    urgency_cost: urgencyCost,
    delivery_cost: deliveryCost,
    discount: 0,
    final_total: finalTotal,
    locked_at: new Date().toISOString(),
  };
}
