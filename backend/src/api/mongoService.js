import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

function toCollectionName(name) {
  return name.trim();
}

function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (id && typeof id === 'object' && id.$oid) {
    return new ObjectId(String(id.$oid));
  }
  const raw = String(id ?? '').trim();
  if (!/^[a-fA-F0-9]{24}$/.test(raw)) {
    const err = new Error('Identifiant MongoDB invalide');
    err.statusCode = 400;
    throw err;
  }
  return new ObjectId(raw);
}

function normalizeDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const { _id, ...rest } = doc;
  const id = _id != null ? String(_id) : rest.id != null ? String(rest.id) : undefined;
  return { ...rest, id, _id: id };
}

export function getCollection(collectionName) {
  const normalizedName = toCollectionName(collectionName);
  if (!normalizedName) {
    throw new Error('collectionName is required');
  }

  return mongoose.connection.db.collection(normalizedName);
}

export async function listCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections?.map((item) => ({
    name: item.name,
    type: item.type
  }));
}

export async function findDocuments(collectionName, limit = 100) {
  const collection = getCollection(collectionName);
  const docs = await collection.find({}).limit(limit).toArray();
  return docs.map(normalizeDoc);
}

export async function createDocument(collectionName, payload) {
  const collection = getCollection(collectionName);
  const { _id, id, ...clean } = payload || {};
  const insertResult = await collection.insertOne(clean);
  return normalizeDoc({ _id: insertResult.insertedId, ...clean });
}

export async function updateDocument(collectionName, id, payload) {
  const collection = getCollection(collectionName);
  const objectId = toObjectId(id);
  const { _id, id: _ignoreId, ...updateData } = payload || {};
  await collection.updateOne({ _id: objectId }, { $set: updateData });
  const updated = await collection.findOne({ _id: objectId });
  return normalizeDoc(updated || { _id: objectId, ...updateData });
}

export async function deleteDocument(collectionName, id) {
  const collection = getCollection(collectionName);
  await collection.deleteOne({ _id: toObjectId(id) });
}
