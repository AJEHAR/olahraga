// Ujian manual ringkas untuk logik teras (lib/ranking.js) — jalankan dengan:
//   node src/lib/ranking.test.manual.mjs
// (Tiada rangka ujian tambahan dipasang untuk kekal ringan; tukar kepada vitest bila perlu.)

import {
  calculatePositions,
  bestAttempt,
  pointsForPosition,
  aggregateTeamPoints,
  formatTime,
  parseTimeToSeconds,
  calculateAge,
} from './ranking.js'

let pass = 0
let fail = 0
function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    pass++
  } else {
    fail++
    console.error(`✗ ${label}\n  dijangka: ${e}\n  sebenar : ${a}`)
  }
}

// Trek: masa rendah menang
assertEqual(
  calculatePositions(
    [
      { participantId: 'a', value: 12.5 },
      { participantId: 'b', value: 11.9 },
      { participantId: 'c', value: 13.1 },
    ],
    'trek'
  ).map((r) => [r.participantId, r.position]),
  [
    ['b', 1],
    ['a', 2],
    ['c', 3],
  ],
  'trek: masa rendah menang'
)

// Padang: jarak besar menang
assertEqual(
  calculatePositions(
    [
      { participantId: 'a', value: 5.2 },
      { participantId: 'b', value: 6.1 },
    ],
    'padang'
  ).map((r) => [r.participantId, r.position]),
  [
    ['b', 1],
    ['a', 2],
  ],
  'padang: jarak besar menang'
)

// Seri: kongsi kedudukan
assertEqual(
  calculatePositions(
    [
      { participantId: 'a', value: 10.0 },
      { participantId: 'b', value: 10.0 },
      { participantId: 'c', value: 11.0 },
    ],
    'trek'
  ).map((r) => [r.participantId, r.position]),
  [
    ['a', 1],
    ['b', 1],
    ['c', 3],
  ],
  'seri: kongsi kedudukan (1,1,3)'
)

// DNS/DNF: tiada kedudukan
assertEqual(
  calculatePositions(
    [
      { participantId: 'a', value: 10.0 },
      { participantId: 'b', value: null },
    ],
    'trek'
  ).map((r) => [r.participantId, r.position]),
  [
    ['a', 1],
    ['b', null],
  ],
  'DNS/DNF diletak tanpa kedudukan'
)

assertEqual(bestAttempt([4.2, 5.1, null, 4.8]), 5.1, 'bestAttempt ambil nilai maksimum')
assertEqual(bestAttempt([]), null, 'bestAttempt kosong = null')

assertEqual(pointsForPosition(1, { 1: 5, 2: 3, 3: 1 }), 5, 'mata tempat 1')
assertEqual(pointsForPosition(4, { 1: 5, 2: 3, 3: 1 }), 0, 'mata luar jadual = 0')
assertEqual(pointsForPosition(null, { 1: 5 }), 0, 'tiada kedudukan = 0 mata')

assertEqual(
  aggregateTeamPoints([
    { teamId: 't1', points: 5 },
    { teamId: 't2', points: 3 },
    { teamId: 't1', points: 1 },
  ]),
  [
    { teamId: 't1', totalPoints: 6 },
    { teamId: 't2', totalPoints: 3 },
  ],
  'agregat mata pasukan & susun tertinggi dahulu'
)

assertEqual(formatTime(65.5), '01:05.50', 'format masa mm:ss.ss')
assertEqual(parseTimeToSeconds('01:05.50'), 65.5, 'parse mm:ss.ss')
assertEqual(parseTimeToSeconds('11.9'), 11.9, 'parse ss.ss')

assertEqual(calculateAge('2015-06-01', new Date('2026-09-22')), 11, 'kira umur')

console.log(`\n${pass} lulus, ${fail} gagal`)
if (fail > 0) process.exit(1)
