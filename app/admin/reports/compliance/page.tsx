'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface User {
    id: number
    name: string
}

interface DailyReport {
    date: string
    dayOfWeek: number
    expectedHours: number
    actualHours: number
    compliant: boolean
    isWorkDay: boolean
}

export default function ComplianceReport() {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUser, setSelectedUser] = useState('')
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    const [report, setReport] = useState<DailyReport[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetch('/api/admin/users')
            .then(res => res.json())
            .then(setUsers)
    }, [])

    const generateReport = async () => {
        if (!selectedUser) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/reports/compliance?userId=${selectedUser}&from=${startDate}&to=${endDate}`)
            const data = await res.json()
            setReport(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getDayName = (dayOfWeek: number) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        return days[dayOfWeek]
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Informe de Cumplimiento Horario</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-bold mb-2">Usuario</label>
                    <select
                        className="border p-2 rounded w-64"
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                    >
                        <option value="">Seleccionar Usuario...</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Desde</label>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Hasta</label>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
                <button
                    onClick={generateReport}
                    disabled={!selectedUser || loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Generando...' : 'Generar Informe'}
                </button>
            </div>

            {report.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Día</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Esperadas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Horas Reales</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {report.map((row) => (
                                <tr key={row.date} className={!row.compliant && row.isWorkDay ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {format(new Date(row.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getDayName(row.dayOfWeek)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {row.expectedHours.toFixed(2)} h
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${!row.compliant && row.isWorkDay ? 'text-red-600' : 'text-green-600'}`}>
                                        {row.actualHours.toFixed(2)} h
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        {row.isWorkDay ? (
                                            row.compliant ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Cumplido
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Incumplido
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
