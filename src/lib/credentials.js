// Jana username & password automatik untuk akaun Admin (tiada emel diperlukan).
// Firebase Auth perlukan format emel, jadi username digunakan sebagai "pseudo-emel"
// dengan domain dalaman @olahraga.local — tidak pernah dihantar mel sebenar.

const PSEUDO_DOMAIN = 'olahraga.local'
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789' // tanpa 0/O/1/l/I

/** Bersihkan Kod Pertandingan → username selamat (huruf kecil, angka, tanda sempang). */
export function slugifyUsername(raw) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30)
}

export function toPseudoEmail(username) {
  return `${username}@${PSEUDO_DOMAIN}`
}

/** true jika input log masuk kelihatan seperti username auto-jana (bukan emel sebenar). */
export function resolveLoginEmail(input) {
  const trimmed = (input || '').trim()
  if (trimmed.includes('@')) return trimmed // emel sebenar (Pengurus Pasukan / Super Admin)
  return toPseudoEmail(trimmed.toLowerCase())
}

export function generatePassword(length = 8) {
  const bytes = new Uint32Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 4294967295)
  }
  let out = ''
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length]
  return out
}
