export const DEFAULT_COMMERCIAL_PERCENTAGE = 0.3;
/** Taux métier chambre de commerce : 1 USD = 178 FDJ */
export const COMMERCIAL_CHAMBER_DJF_RATE = 178;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Parse un nombre saisi (supporte la virgule décimale FR). */
export function parseLocalizedNumber(raw: string | number | undefined | null): number {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const normalized = String(raw).trim().replace(/\s/g, '').replace(/,/g, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function parseDjfExchangeRate(raw: string | number | undefined | null): number {
  return COMMERCIAL_CHAMBER_DJF_RATE;
}

export function getCommercialChamberDjfRate(_configRate?: string | number | null): number {
  return COMMERCIAL_CHAMBER_DJF_RATE;
}

/** Prix unitaire (USD) × pourcentage / 100 → montant service en USD. */
export function computeServiceChargeUsd(
  unitPriceUsd: number,
  percentage: number = DEFAULT_COMMERCIAL_PERCENTAGE
): number {
  const pct = percentage > 0 ? percentage : DEFAULT_COMMERCIAL_PERCENTAGE;
  // 0,3 % → multiplier par 0,003 (ex. 120 × 0,003 = 0,36 USD)
  return round2(unitPriceUsd * (pct / 100));
}

/** Service charge en francs djiboutiens (conversion depuis USD). */
export function computeServiceChargeDjf(
  unitPriceUsd: number,
  djfRate: number,
  percentage: number = DEFAULT_COMMERCIAL_PERCENTAGE
): number {
  const usd = computeServiceChargeUsd(unitPriceUsd, percentage);
  const rate = getCommercialChamberDjfRate(djfRate);
  return round2(usd * rate);
}

export function computeCommercialTotal(parts: {
  chamber_service_amount: number;
  service_charge: number;
  bank_commission_fee: number;
  transport_dhl: number;
  certificate_fee: number;
}): number {
  return round2(
    (parts.chamber_service_amount || 0) +
      (parts.service_charge || 0) +
      (parts.bank_commission_fee || 0) +
      (parts.transport_dhl || 0) +
      (parts.certificate_fee || 0)
  );
}

export function buildCommercialAmounts(
  input: {
    unit_price?: number;
    percentage?: number;
    chamber_service_amount?: number;
    bank_commission_fee?: number;
    transport_dhl?: number;
    certificate_fee?: number;
  },
  djfRate: number
) {
  const unitPrice = Number(input.unit_price) || 0;
  const percentage =
    Number(input.percentage) > 0 ? Number(input.percentage) : DEFAULT_COMMERCIAL_PERCENTAGE;
  const serviceChargeUsd = computeServiceChargeUsd(unitPrice, percentage);
  const serviceChargeDjf = computeServiceChargeDjf(unitPrice, djfRate, percentage);
  const chamber = Number(input.chamber_service_amount) || 0;
  const bank = Number(input.bank_commission_fee) || 0;
  const transport = Number(input.transport_dhl) || 0;
  const certificate = Number(input.certificate_fee) || 0;
  const total = computeCommercialTotal({
    chamber_service_amount: chamber,
    service_charge: serviceChargeDjf,
    bank_commission_fee: bank,
    transport_dhl: transport,
    certificate_fee: certificate,
  });

  return {
    percentage,
    service_charge: serviceChargeDjf,
    service_charge_usd: serviceChargeUsd,
    total,
  };
}
