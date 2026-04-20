import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import { ALL_MENU_PERMISSIONS } from '../constants/menuPermissions.js';

const SALT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function listUsers() {
  return User.find({}).sort({ createdAt: -1 }).lean();
}

export async function getUserById(id) {
  return User.findById(id).lean();
}

export async function createUser(body) {
  const { nom, role, permissions, email, password } = body;
  if (!nom || !role || !email || !password) {
    const err = new Error('nom, role, email et password sont requis');
    err.statusCode = 400;
    throw err;
  }
  const hashed = await hashPassword(String(password));
  const perms =
    Array.isArray(permissions) && permissions.length > 0 ? permissions : ALL_MENU_PERMISSIONS;
  const user = await User.create({
    nom: String(nom).trim(),
    role: String(role).trim(),
    permissions: perms,
    email: String(email).trim().toLowerCase(),
    password: hashed,
  });
  return user.toJSON();
}

export async function updateUser(id, body) {
  const payload = { ...body };
  if (payload.password != null && payload.password !== '') {
    payload.password = await hashPassword(String(payload.password));
  } else {
    delete payload.password;
  }
  delete payload._id;
  if (payload.email) {
    payload.email = String(payload.email).trim().toLowerCase();
  }
  const user = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }
  delete user.password;
  return user;
}

export async function deleteUser(id) {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}

/** Connexion MongoDB (email + mot de passe en clair). */
export async function authenticateUser(email, plainPassword) {
  if (!email || !plainPassword) {
    const err = new Error('email et password requis');
    err.statusCode = 400;
    throw err;
  }
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select(
    '+password'
  );
  if (!user || !user.password) {
    const err = new Error('Identifiants invalides');
    err.statusCode = 401;
    throw err;
  }
  const ok = await verifyPassword(plainPassword, user.password);
  if (!ok) {
    const err = new Error('Identifiants invalides');
    err.statusCode = 401;
    throw err;
  }
  return User.findById(user._id).lean();
}

/**
 * Crée ou met à jour le super-admin demandé (seed).
 */
export async function upsertSuperAdminSeed({
  nom = 'administrateurs',
  role = 'superadmin',
  email = 'geosomtech@geosomtech.com',
  password = 'geoAdmin/2026',
  permissions = ALL_MENU_PERMISSIONS,
} = {}) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const hashed = await hashPassword(String(password));
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        nom: String(nom).trim(),
        role: String(role).trim(),
        permissions: Array.isArray(permissions) ? permissions : ALL_MENU_PERMISSIONS,
        password: hashed,
        email: normalizedEmail,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
  return user.toJSON();
}
