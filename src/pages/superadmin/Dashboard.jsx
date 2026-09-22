import { collection } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useCollectionData } from '../../hooks/useLiveDoc'
import { PageHeader, StatCard, Spinner } from '../../components/UI'

export default function SuperAdminDashboard() {
  const { data: competitions, loading: l1 } = useCollectionData(collection(db, 'competitions'))
  const { data: teams, loading: l2 } = useCollectionData(collection(db, 'teams'))
  const { data: users, loading: l3 } = useCollectionData(collection(db, 'users'))

  if (l1 || l2 || l3) return <Spinner />

  return (
    <div>
      <PageHeader title="Dashboard Super Admin" subtitle="Seluruh platform" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pertandingan" value={competitions.length} />
        <StatCard label="Pasukan" value={teams.length} />
        <StatCard label="Pengguna" value={users.length} />
        <StatCard label="Admin" value={users.filter((u) => u.role === 'admin').length} />
      </div>
      <div className="mt-8 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2.5">Kod</th>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">Organisasi</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{c.code}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 text-slate-500">{c.orgName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
