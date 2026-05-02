import { Client } from '../models/Client.model.js';

export async function listClients() {
  const docs = await Client.find({}).sort({ createdAt: -1 });
  return docs?.map((d) => d.toJSON());
}

export async function getClientById(id) {
  const doc = await Client.findById(id);
  return doc ? doc.toJSON() : null;
}

export async function createClient(body) {
  const name = String(body?.name || '').trim();
  if (!name) {
    const err = new Error('Le nom du client est requis');
    err.statusCode = 400;
    throw err;
  }
  const doc = await Client.create({
    name,
    company_name: String(body?.company_name || '').trim(),
    email: String(body?.email || '').trim(),
    phone: String(body?.phone || '').trim(),
    address: String(body?.address || '').trim(),
  });
  return doc.toJSON();
}

export async function updateClient(id, body) {
  const payload = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      const err = new Error('Le nom du client ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    payload.name = name;
  }
  if (body.company_name !== undefined) payload.company_name = String(body.company_name).trim();
  if (body.email !== undefined) payload.email = String(body.email).trim();
  if (body.phone !== undefined) payload.phone = String(body.phone).trim();
  if (body.address !== undefined) payload.address = String(body.address).trim();

  const doc = await Client.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!doc) {
    const err = new Error('Client introuvable');
    err.statusCode = 404;
    throw err;
  }
  return doc.toJSON();
}

export async function deleteClient(id) {
  const result = await Client.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Client introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}
