import { doc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { useDocData } from './useLiveDoc'

/** Data pasukan bagi Pengurus Pasukan yang log masuk semasa. */
export function useMyTeam() {
  const { profile } = useAuth()
  const { data: team, loading } = useDocData(profile?.teamId ? doc(db, 'teams', profile.teamId) : null)
  return { team, loading, teamId: profile?.teamId, orgId: profile?.orgId }
}
