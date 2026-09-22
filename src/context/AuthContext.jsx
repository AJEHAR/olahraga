import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Firebase Auth user
  const [profile, setProfile] = useState(null) // users/{uid} doc: role, orgId, teamId
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Admin self-signup — cipta akaun Auth + doc users/{uid} dengan role 'admin'
  async function signUpAsAdmin({ email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      role: 'admin',
      orgId: cred.user.uid,
      email,
      createdAt: serverTimestamp(),
    })
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    setProfile({ id: snap.id, ...snap.data() })
    return cred.user
  }

  async function signIn({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    return cred.user
  }

  async function signOut() {
    await fbSignOut(auth)
    setProfile(null)
  }

  const value = { user, profile, loading, signIn, signUpAsAdmin, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth mesti digunakan dalam <AuthProvider>')
  return ctx
}
