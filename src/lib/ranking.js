// Logik teras: kedudukan automatik + pengiraan mata pasukan (Spesifikasi §4.4, §4.5)
// Fungsi tersendiri & mudah diuji — tiada pergantungan Firestore di sini.

/**
 * Kira kedudukan (1, 2, 3, …) untuk satu acara.
 * @param {Array<{participantId: string, value: number}>} entries - value = saat (trek) atau meter (padang)
 * @param {'trek'|'padang'} type
 * @returns {Array<{participantId: string, value: number, position: number}>} disusun ikut kedudukan
 *
 * Peraturan: trek — masa RENDAH menang; padang — jarak/tinggi BESAR menang.
 * Peserta dengan nilai sama kongsi kedudukan sama (standard competition ranking, cth 1,1,3).
 * Peserta tanpa nilai (DNS/DNF, value == null) diletakkan di hujung, tiada kedudukan (null).
 */
export function calculatePositions(entries, type) {
  const withValue = entries.filter((e) => e.value != null && !Number.isNaN(e.value))
  const withoutValue = entries.filter((e) => e.value == null || Number.isNaN(e.value))

  const sorted = [...withValue].sort((a, b) =>
    type === 'trek' ? a.value - b.value : b.value - a.value
  )

  const ranked = []
  let lastValue = null
  let lastPosition = 0
  sorted.forEach((entry, idx) => {
    const position = entry.value === lastValue ? lastPosition : idx + 1
    ranked.push({ ...entry, position })
    lastValue = entry.value
    lastPosition = position
  })

  const unranked = withoutValue.map((e) => ({ ...e, position: null }))
  return [...ranked, ...unranked]
}

/**
 * Nilai terbaik daripada beberapa percubaan (acara padang). Padang: max menang.
 * @param {number[]} attempts
 * @returns {number|null}
 */
export function bestAttempt(attempts) {
  const valid = (attempts || []).filter((a) => a != null && !Number.isNaN(a))
  if (valid.length === 0) return null
  return Math.max(...valid)
}

/**
 * Mata untuk satu kedudukan, ikut jadual mata (pointsTable), 0 jika tiada tempat/luar jadual.
 * @param {number|null} position
 * @param {Record<string, number>} pointsTable - cth { "1": 5, "2": 3, "3": 1 }
 */
export function pointsForPosition(position, pointsTable) {
  if (position == null) return 0
  return pointsTable?.[String(position)] ?? 0
}

/**
 * Agregat jumlah mata setiap pasukan daripada senarai keputusan sah (disahkan) merentasi acara.
 * @param {Array<{teamId: string, points: number}>} allResults
 * @returns {Array<{teamId: string, totalPoints: number}>} disusun tertinggi dahulu
 */
export function aggregateTeamPoints(allResults) {
  const totals = {}
  for (const r of allResults) {
    if (!r.teamId) continue
    totals[r.teamId] = (totals[r.teamId] || 0) + (r.points || 0)
  }
  return Object.entries(totals)
    .map(([teamId, totalPoints]) => ({ teamId, totalPoints }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}

/** Format saat → "mm:ss.ss" untuk paparan. */
export function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

/** Tukar "mm:ss.ss" atau "ss.ss" input kepada jumlah saat (float). */
export function parseTimeToSeconds(input) {
  if (input == null || input === '') return null
  const str = String(input).trim()
  if (str.includes(':')) {
    const [m, s] = str.split(':')
    const mins = parseInt(m, 10) || 0
    const secs = parseFloat(s) || 0
    return mins * 60 + secs
  }
  const val = parseFloat(str)
  return Number.isNaN(val) ? null : val
}

/** Auto-tentukan kategori umur layak berdasarkan tarikh lahir & senarai kategori kejohanan. */
export function eligibleCategories(dob, categories, genderId) {
  if (!dob) return []
  const age = calculateAge(dob)
  return categories.filter((c) => c.gender === genderId && ageQualifies(age, c.ageGroup))
}

export function calculateAge(dob, asOf = new Date()) {
  const birth = new Date(dob)
  let age = asOf.getFullYear() - birth.getFullYear()
  const m = asOf.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age--
  return age
}

function ageQualifies(age, ageGroupLabel) {
  // "Bawah N" → age < N; "Terbuka" → sentiasa layak; lain-lain label → anggap layak (Admin tetapkan manual jika perlu)
  const match = /Bawah\s+(\d+)/i.exec(ageGroupLabel || '')
  if (match) return age < parseInt(match[1], 10)
  return true
}
