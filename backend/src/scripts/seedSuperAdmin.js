import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectMongo } from '../config/mongodb.js';
import { upsertSuperAdminSeed } from '../api/userService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  await connectMongo();
  const user = await upsertSuperAdminSeed({
    nom: 'administrateurs',
    role: 'superadmin',
    email: 'geosomtech@geosomtech.com',
    password: 'geoAdmin/2026',
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        message: 'Super-admin créé ou mis à jour',
        user,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error('Seed super-admin échoué:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
