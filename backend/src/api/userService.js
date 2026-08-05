import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import { ALL_MENU_PERMISSIONS } from '../constants/menuPermissions.js';
import { getCollection } from './mongoService.js';

const SALT_ROUNDS = 10;

const FULL_ACCESS_ROLES = new Set(['superadmin', 'administrator', 'admin']);

function isFullAccessRole(role) {
  return FULL_ACCESS_ROLES.has(String(role || '').trim().toLowerCase());
}

async function findRoleByName(roleName) {
  const name = String(roleName || '').trim();
  if (!name) return null;
  const col = await getCollection('roles');
  const exact = await col.findOne({ name });
  if (exact) return exact;
  const all = await col.find({}).toArray();
  return (
    all.find((r) => String(r.name || '').trim().toLowerCase() === name.toLowerCase()) || null
  );
}

export async function resolvePermissionsForRole(roleName, fallbackPermissions) {
  if (isFullAccessRole(roleName)) {
    return [...ALL_MENU_PERMISSIONS];
  }
  try {
    const roleDoc = await findRoleByName(roleName);
    if (Array.isArray(roleDoc?.permissions) && roleDoc.permissions.length > 0) {
      return roleDoc.permissions.map(String);
    }
  } catch {
    /* ignore lookup errors */
  }
  if (Array.isArray(fallbackPermissions) && fallbackPermissions.length > 0) {
    return fallbackPermissions.map(String);
  }
  return ['dashboard'];
}

export async function syncUsersPermissionsByRole(roleName, permissions) {
  const name = String(roleName || '').trim();
  if (!name) return { matched: 0 };
  const perms = Array.isArray(permissions) ? permissions.map(String) : ['dashboard'];
  const result = await User.updateMany(
    { role: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
    { $set: { permissions: perms } }
  );
  return { matched: result.matchedCount || result.n || 0 };
}

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
  const perms = await resolvePermissionsForRole(
    role,
    Array.isArray(permissions) && permissions.length > 0 ? permissions : undefined
  );
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
  if (payload.role && !Array.isArray(payload.permissions)) {
    payload.permissions = await resolvePermissionsForRole(payload.role);
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
  const lean = await User.findById(user._id).lean();
  if (!lean) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 404;
    throw err;
  }
  lean.permissions = await resolvePermissionsForRole(lean.role, lean.permissions);
  // Keep user document in sync with role permissions
  await User.updateOne({ _id: lean._id }, { $set: { permissions: lean.permissions } });
  return lean;
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
