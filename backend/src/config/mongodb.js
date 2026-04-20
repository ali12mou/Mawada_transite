import mongoose from 'mongoose';

const defaultMongoUri = 'mongodb://127.0.0.1:27017/transit-transport';

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI || defaultMongoUri;

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || 'transit-transport'
  });

  return mongoose.connection;
}

export function getMongoConnectionState() {
  return mongoose.connection.readyState;
}
