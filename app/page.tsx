'use client'

import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

interface User {
  id: number
  name: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <Dashboard user={user} onLogout={() => setUser(null)} />
      )}
    </main>
  )
}
