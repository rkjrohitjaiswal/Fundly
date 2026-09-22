import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt with standard salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a candidate plaintext password with an existing bcrypt password hash.
 */
export async function comparePassword(candidatePassword: string, passwordHash: string): Promise<boolean> {
  if (!candidatePassword || !passwordHash) return false;
  return bcrypt.compare(candidatePassword, passwordHash);
}
