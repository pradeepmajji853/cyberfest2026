export const normalizeTeamKey = (teamName: string) => {
  const trimmed = teamName.trim().toLowerCase();
  // Keep it stable + Firestore-doc-id friendly
  return trimmed
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80);
};

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hexToBytes = (hex: string) => {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const sha256Hex = async (input: string) => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
};

export const generateSaltHex = (byteLength = 16) => {
  const saltBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(saltBytes);
  return bytesToHex(saltBytes);
};

export const createPasswordHash = async (password: string, saltHex: string) => {
  // sha256( salt || password ) as hex, where salt is raw bytes.
  // We encode saltHex back to bytes to avoid accidental unicode differences.
  const saltBytes = hexToBytes(saltHex);
  const saltString = bytesToHex(saltBytes); // normalized hex
  return sha256Hex(`${saltString}:${password}`);
};

export const verifyPassword = async (password: string, saltHex: string, expectedHashHex: string) => {
  const computed = await createPasswordHash(password, saltHex);
  return computed === expectedHashHex.trim().toLowerCase();
};
