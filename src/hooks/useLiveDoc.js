import { useEffect, useState } from 'react'
import { onSnapshot, query as fsQuery } from 'firebase/firestore'

/** Langgan satu dokumen Firestore secara live. `ref` = doc(db, ...) atau null. */
export function useDocData(ref) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ref) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.path])

  return { data, loading, error }
}

/** Langgan satu koleksi/query Firestore secara live. `refOrQuery` boleh jadi collection() atau query(). */
export function useCollectionData(refOrQuery, extraConstraints = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!refOrQuery) {
      setData([])
      setLoading(false)
      return
    }
    const q = extraConstraints.length ? fsQuery(refOrQuery, ...extraConstraints) : refOrQuery
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
  }, [refOrQuery?.path ?? JSON.stringify(refOrQuery?._query ?? {})])

  return { data, loading, error }
}
