export const DEFAULT_COMMERCIAL_PERCENTAGE = 0.3;
/** Taux métier chambre de commerce : 1 USD = 178 FDJ */
export const COMMERCIAL_CHAMBER_DJF_RATE = 178;

function round2(value) {
  return Math.round(value * 100) / 100;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function parseDjfExchangeRate() {
  return COMMERCIAL_CHAMBER_DJF_RATE;
}

export async function getDjfExchangeRate() {
  return COMMERCIAL_CHAMBER_DJF_RATE;
}

export function computeServiceChargeUsd(unitPriceUsd, percentage = DEFAULT_COMMERCIAL_PERCENTAGE) {
  const pct = percentage > 0 ? percentage : DEFAULT_COMMERCIAL_PERCENTAGE;
  return round2(toNumber(unitPriceUsd) * (pct / 100));
}

export function computeServiceChargeDjf(unitPriceUsd, _djfRate, percentage = DEFAULT_COMMERCIAL_PERCENTAGE) {
  const usd = computeServiceChargeUsd(unitPriceUsd, percentage);
  return round2(usd * COMMERCIAL_CHAMBER_DJF_RATE);
}

export function computeCommercialTotal(parts) {
  return round2(
    toNumber(parts.chamber_service_amount) +
      toNumber(parts.service_charge) +
      toNumber(parts.bank_commission_fee) +
      toNumber(parts.transport_dhl) +
      toNumber(parts.certificate_fee)
  );
}

export function applyCommercialCalculations(body) {
  const unitPrice = toNumber(body?.unit_price);
  const percentage = toNumber(body?.percentage) > 0 ? toNumber(body.percentage) : DEFAULT_COMMERCIAL_PERCENTAGE;
  const serviceCharge = computeServiceChargeDjf(unitPrice, COMMERCIAL_CHAMBER_DJF_RATE, percentage);
  const chamber = toNumber(body?.chamber_service_amount);
  const bank = toNumber(body?.bank_commission_fee);
  const transport = toNumber(body?.transport_dhl);
  const certificate = toNumber(body?.certificate_fee);

  return {
    percentage,
    service_charge: serviceCharge,
    total: computeCommercialTotal({
      chamber_service_amount: chamber,
      service_charge: serviceCharge,
      bank_commission_fee: bank,
      transport_dhl: transport,
      certificate_fee: certificate,
    }),
  };
}
