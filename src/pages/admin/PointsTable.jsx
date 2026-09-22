import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { PageHeader, Spinner, EmptyState, ErrorBanner } from '../../components/UI'

export default function PointsTable() {
  const { comp, loading } = useAdminCompetition()
  if (loading) return <Spinner />
  if (!comp) return <EmptyState title="Tiada pertandingan dijumpai" />
  return <PointsTableContent comp={comp} />
}

function PointsTableContent({ comp }) {
  const [rows, setRows] = useState(() => tableToRows(comp.pointsTable || { 1: 5, 2: 3, 3: 1 }))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateRow(idx, field, value) {
    setSaved(false)
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setSaved(false)
    const nextPos = Math.max(0, ...rows.map((r) => Number(r.position) || 0)) + 1
    setRows((r) => [...r, { position: String(nextPos), points: '0' }])
  }

  function removeRow(idx) {
    setSaved(false)
    setRows((r) => r.filter((_, i) => i !== idx))
  }

  async function save() {
    setError('')
    const pointsTable = {}
    for (const row of rows) {
      const pos = parseInt(row.position, 10)
      const pts = parseInt(row.points, 10)
      if (!pos || Number.isNaN(pts)) {
        setError('Setiap baris perlu kedudukan & mata yang sah.')
        return
      }
      pointsTable[String(pos)] = pts
    }
    setBusy(true)
    try {
      await updateDoc(doc(db, 'competitions', comp.id), { pointsTable })
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Tetapan Jadual Mata" subtitle={comp.name} />
      <div className="max-w-md card p-4">
        <ErrorBanner message={error} />
        {saved && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">Jadual mata disimpan.</p>}
        <p className="mb-3 text-sm text-slate-500">Tetapkan mata bagi setiap kedudukan dalam acara individu.</p>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-16 text-sm text-slate-500">Tempat</span>
              <input
                className="input w-20"
                type="number"
                min="1"
                value={row.position}
                onChange={(e) => updateRow(idx, 'position', e.target.value)}
              />
              <span className="text-sm text-slate-500">=</span>
              <input
                className="input w-20"
                type="number"
                min="0"
                value={row.points}
                onChange={(e) => updateRow(idx, 'points', e.target.value)}
              />
              <span className="text-sm text-slate-500">mata</span>
              <button onClick={() => removeRow(idx)} className="ml-auto text-xs text-red-500 hover:underline">
                Buang
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={addRow} className="btn-secondary text-sm">
            + Tambah Baris
          </button>
          <button onClick={save} className="btn-primary text-sm" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function tableToRows(table) {
  return Object.entries(table)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([position, points]) => ({ position, points: String(points) }))
}
