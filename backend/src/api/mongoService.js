import mongoose from 'mongoose';

function toCollectionName(name) {
  return name.trim();
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
  return collections.map((item) => ({
    name: item.name,
    type: item.type
  }));
}

export async function findDocuments(collectionName, limit = 100) {
  const collection = getCollection(collectionName);
  const docs = await collection.find({}).limit(limit).toArray();
  return docs;
}

export async function createDocument(collectionName, payload) {
  const collection = getCollection(collectionName);
  const insertResult = await collection.insertOne(payload);
  return {
    insertedId: insertResult.insertedId
  };
}
