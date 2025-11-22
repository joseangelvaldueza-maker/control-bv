'use client'

import { useEffect, useState } from 'react'

interface TimeEntry {
    id: number
    type: string
    timestamp: string
    user: {
        name: string
    }
}

export default function History({ refreshTrigger }: { refreshTrigger: number }) {
    const [entries, setEntries] = useState<TimeEntry[]>([])

    useEffect(() => {
        fetch('/api/history')
            .then((res) => res.json())
            .then((data) => setEntries(data))
    }, [refreshTrigger])

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
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Últimos Registros</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Usuario</th>
                            <th className="px-4 py-2 border-b">Acción</th>
                            <th className="px-4 py-2 border-b">Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-b text-center">{entry.user.name}</td>
                                <td className="px-4 py-2 border-b text-center">{formatType(entry.type)}</td>
                                <td className="px-4 py-2 border-b text-center">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
