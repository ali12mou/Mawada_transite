import { Configuration } from '../models/Configuration.model.js';

export async function getAllConfigMap() {
  const rows = await Configuration.find({}).lean();
  const map = {};
  for (const row of rows) {
    map[row.key] = row.value ?? '';
  }
  return map;
}

/** upsert plusieurs clés (valeurs string ; images en data URL autorisées côté client) */
export async function upsertConfigMap(updates) {
  if (!updates || typeof updates !== 'object') {
    return getAllConfigMap();
  }
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    const k = String(key).trim();
    if (!k) continue;
    const v = value == null ? '' : String(value);
    await Configuration.findOneAndUpdate(
      { key: k },
      { $set: { value: v } },
      { upsert: true, new: true }
    );
  }
  return getAllConfigMap();
}
