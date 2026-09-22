import { useEffect, useState } from 'react'
import { collection, onSnapshot, query as fsQuery } from 'firebase/firestore'

/**
 * Langgan koleksi Firestore secara live.
 * @param {import('firebase/firestore').CollectionReference|null} colRef
 * @param {Array} queryConstraints - array of where()/orderBy() etc, optional
 */
export function useCollection(colRef, queryConstraints = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!colRef) {
      setData([])
      setLoading(false)
      return
    }
    const q = queryConstraints.length ? fsQuery(colRef, ...queryConstraints) : colRef
    setLoading(true)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colRef])

  return { data, loading, error }
}

export { collection }
