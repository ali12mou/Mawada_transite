import { Company } from '../models/Company.model.js';

export async function listCompanies() {
  const docs = await Company.find({}).sort({ createdAt: -1 });
  return docs.map((d) => d.toJSON());
}

export async function getCompanyById(id) {
  const doc = await Company.findById(id);
  return doc ? doc.toJSON() : null;
}

export async function createCompany(body) {
  const name = String(body?.name || '').trim();
  if (!name) {
    const err = new Error('Le nom de l’entreprise est requis');
    err.statusCode = 400;
    throw err;
  }
  const doc = await Company.create({
    name,
    address: String(body?.address || '').trim(),
  });
  return doc.toJSON();
}

export async function updateCompany(id, body) {
  const payload = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      const err = new Error('Le nom de l’entreprise ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    payload.name = name;
  }
  if (body.address !== undefined) payload.address = String(body.address).trim();

  const doc = await Company.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Entreprise introuvable');
    err.statusCode = 404;
    throw err;
  }
  return doc.toJSON();
}

export async function deleteCompany(id) {
  const result = await Company.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Entreprise introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}
