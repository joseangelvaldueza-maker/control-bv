'use client'

import { useState, useEffect } from 'react'

interface User {
    id: number
    name: string
}

interface LoginProps {
    onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('/api/users')
            .then((res) => res.json())
            .then((data) => setUsers(data))
    }, [])

    const handleLogin = async () => {
        if (!selectedUserId || !pin) {
            setError('Selecciona usuario e ingresa PIN')
            return
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId, pin }),
            })

            const data = await res.json()

            if (res.ok) {
                onLogin(data.user)
            } else {
                setError(data.error)
            }
        } catch (e) {
            setError('Error de conexión')
        }
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="">Seleccionar...</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
                <input
                    type="password"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="****"
                />
            </div>

            {error && <div className="text-red-500 text-center mb-4">{error}</div>}

            <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
                Entrar
            </button>
        </div>
    )
}
