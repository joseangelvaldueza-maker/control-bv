'use client'

import { useState, useEffect } from 'react'
import History from './History'

interface User {
    id: number
    name: string
}

interface DashboardProps {
    user: User
    onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
    const [status, setStatus] = useState('LOADING') // NOT_STARTED, WORKING, ON_BREAK, DONE
    const [message, setMessage] = useState('')
    const [refreshHistory, setRefreshHistory] = useState(0)

    const fetchStatus = async () => {
        const res = await fetch(`/api/user/${user.id}/status`)
        const data = await res.json()
        setStatus(data.status)
    }

    useEffect(() => {
        fetchStatus()
    }, [user.id])

    const handleClock = async (type: string) => {
        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, type }),
            })

            const data = await res.json()

            if (res.ok) {
                setMessage(`Acción registrada: ${type}`)
                setRefreshHistory((prev) => prev + 1)
                fetchStatus()
                setTimeout(() => setMessage(''), 3000)
            } else {
                setMessage(`Error: ${data.error}`)
            }
        } catch (error) {
            setMessage('Error de conexión')
        }
    }

    if (status === 'LOADING') return <div className="text-center">Cargando estado...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Hola, {user.name}</h1>
                <button onClick={onLogout} className="text-red-500 hover:underline">Cerrar Sesión</button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                {message && (
                    <div className={`p-4 rounded-md mb-6 text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {status === 'NOT_STARTED' && (
                        <button
                            onClick={() => handleClock('CLOCK_IN')}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 rounded-lg text-xl transition-colors"
                        >
                            REGISTRAR ENTRADA
                        </button>
                    )}

                    {status === 'WORKING' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleClock('BREAK_START')}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 rounded-lg text-xl transition-colors"
                            >
                                INICIO DESCANSO
                            </button>
                            <button
                                onClick={() => handleClock('CLOCK_OUT')}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 rounded-lg text-xl transition-colors"
                            >
                                SALIDA
                            </button>
                        </div>
                    )}

                    {status === 'ON_BREAK' && (
                        <button
                            onClick={() => handleClock('BREAK_END')}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-lg text-xl transition-colors"
                        >
                            VOLVER DE DESCANSO
                        </button>
                    )}

                    {status === 'DONE' && (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                            <h3 className="text-xl font-bold text-gray-600">Jornada Finalizada</h3>
                            <p className="text-gray-500">Has registrado tu salida por hoy.</p>
                        </div>
                    )}
                </div>
            </div>

            <History refreshTrigger={refreshHistory} />
        </div>
    )
}
