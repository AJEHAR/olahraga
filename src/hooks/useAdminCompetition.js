import { useMemo } from 'react'
import { collection, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useCollectionData } from './useLiveDoc'

/**
 * Admin biasanya urus SATU pertandingan aktif bagi org mereka.
 * Hook ini cari pertandingan pertama milik orgId Admin semasa.
 * (Jika Admin urus > 1 pertandingan serentak, boleh dilanjutkan dengan pemilih pertandingan.)
 */
export function useAdminCompetition() {
  const { profile } = useAuth()
  const compsQuery = useMemo(
    () => (profile?.orgId ? query(collection(db, 'competitions'), where('orgId', '==', profile.orgId)) : null),
    [profile?.orgId]
  )
  const { data: comps, loading } = useCollectionData(compsQuery)
  const comp = comps[0] || null
  return { comp, loading, orgId: profile?.orgId }
}
