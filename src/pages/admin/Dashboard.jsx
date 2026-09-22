import { collection, collectionGroup, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAdminCompetition } from '../../hooks/useAdminCompetition'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, StatCard, Spinner } from '../../components/UI'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { comp, loading } = useAdminCompetition()

  if (loading) return <Spinner />
  if (!comp) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        Tiada pertandingan dijumpai bagi akaun ini.
      </div>
    )
  }

  return <DashboardContent comp={comp} />
}

function DashboardContent({ comp }) {
  const { data: events } = useCollectionData(collection(db, 'competitions', comp.id, 'events'))
  const { data: teams } = useCollectionData(query(collection(db, 'teams'), where('competitionCode', '==', comp.code)))
  const { data: participants } = useCollectionData(
    query(collectionGroup(db, 'participants'), where('competitionCode', '==', comp.code))
  )

  const confirmed = events.filter((e) => e.status === 'disahkan').length

  return (
    <div>
      <PageHeader
        title={comp.name}
        subtitle={`Kod Pertandingan: ${comp.code} · ${comp.orgName}`}
        action={
          <Link to={`/keputusan/${comp.code}`} className="btn-secondary text-sm">
            Lihat paparan awam →
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Acara" value={events.length} />
        <StatCard label="Acara Disahkan" value={confirmed} />
        <StatCard label="Pasukan" value={teams.length} />
        <StatCard label="Peserta" value={participants.length} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <QuickLink to="/admin/acara" title="Kategori & Acara" desc="Cipta senarai acara trek & padang" />
        <QuickLink to="/admin/jadual" title="Jadual Acara" desc="Susun atur tarikh, masa & lokasi" />
        <QuickLink to="/admin/heat" title="Jana Heat" desc="Agih peserta ke heat & lorong" />
        <QuickLink to="/admin/keputusan" title="Rekod & Sahkan Keputusan" desc="Masuk masa/jarak, sahkan rasmi" />
        <QuickLink to="/admin/pasukan" title="Pasukan" desc="Jemput Pengurus Pasukan baharu" />
        <QuickLink to="/admin/mata" title="Jadual Mata" desc="Tetapkan mata setiap kedudukan" />
      </div>
    </div>
  )
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="card p-4 transition-shadow hover:shadow-md">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
    </Link>
  )
}
