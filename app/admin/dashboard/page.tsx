'use client'

import { useState, useEffect } from 'react'

interface TimeEntry {
    id: number
    type: string
    timestamp: string
    user: {
        name: string
        email: string
    }
}

interface User {
    id: number
    name: string
}

export default function AdminDashboard() {
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [filters, setFilters] = useState({
        userId: '',
        startDate: '',
        endDate: '',
    })

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then(setUsers)
        fetchReports()
    }, [])

    const fetchReports = () => {
        const params = new URLSearchParams()
        if (filters.userId) params.append('userId', filters.userId)
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)

        fetch(`/api/admin/reports?${params.toString()}`)
            .then(res => res.json())
            .then(setEntries)
    }

    const formatType = (type: string) => {
        switch (type) {
            case 'CLOCK_IN': return 'Entrada'
            case 'CLOCK_OUT': return 'Salida'
            case 'BREAK_START': return 'Inicio Descanso'
            case 'BREAK_END': return 'Fin Descanso'
            default: return type
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Panel de Control - Informes</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-bold mb-4">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">Usuario</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                        >
                            <option value="">Todos</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Desde</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hasta</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={fetchReports}
                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        Filtrar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{entry.user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{formatType(entry.type)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
