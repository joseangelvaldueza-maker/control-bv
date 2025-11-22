'use client'

import { useState, useEffect } from 'react'
import History from './components/History'

interface User {
  id: number
  name: string
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [refreshHistory, setRefreshHistory] = useState(0)

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data))
  }, [])

  const handleClock = async (type: string) => {
    if (!selectedUserId) {
      setMessage('Por favor selecciona un usuario')
      return
    }

    try {
      const res = await fetch('/api/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          type,
          pin: pin || undefined
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`Registro exitoso: ${type}`)
        setPin('')
        setRefreshHistory((prev) => prev + 1)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error de conexión')
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Control Horario</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Seleccionar Usuario...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-2">PIN (Opcional)</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded-md mb-6"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
            />

            {message && (
              <div className={`p-4 rounded-md mb-4 text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleClock('CLOCK_IN')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                ENTRADA
              </button>
              <button
                onClick={() => handleClock('CLOCK_OUT')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                SALIDA
              </button>
              <button
                onClick={() => handleClock('BREAK_START')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                INICIO DESCANSO
              </button>
              <button
                onClick={() => handleClock('BREAK_END')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-lg transition-colors"
              >
                FIN DESCANSO
              </button>
            </div>
          </div>

          <div>
            <History refreshTrigger={refreshHistory} />
          </div>
        </div>
      </div>
    </main>
  )
}
