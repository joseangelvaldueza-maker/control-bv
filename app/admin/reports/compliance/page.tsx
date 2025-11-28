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

// Local interface for editing
interface EditableEntry {
    id: number | string // string for new temp entries
    type: string
    timeStr: string // HH:mm
    originalTimeStr: string
    originalType: string
    isNew?: boolean
    isDeleted?: boolean
}

// Interface for API response
interface RawEntry {
    id: number
    type: string
    timestamp: string
}

const MINUTES_8_HOURS = 480
const MINUTES_4_HOURS = 240
const MINUTES_30_MINS = 30
const MINUTES_2_HOURS = 120
const MINUTES_2_5_HOURS = 150

const TYPE_CLOCK_IN = 'CLOCK_IN'
const TYPE_CLOCK_OUT = 'CLOCK_OUT'
const TYPE_BREAK_START = 'BREAK_START'
const TYPE_BREAK_END = 'BREAK_END'

const DATE_FORMAT_ISO = 'yyyy-MM-dd'
const TIME_FORMAT_HM = 'HH:mm'
const API_JSON_HEADER = { 'Content-Type': 'application/json' }

export default function ComplianceReport() {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUser, setSelectedUser] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [report, setReport] = useState<DailyReport[]>([])
    const [loading, setLoading] = useState(false)

    // Modal state
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedDateStr, setSelectedDateStr] = useState('')

    // Local editing state
    const [localEntries, setLocalEntries] = useState<EditableEntry[]>([])
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        setStartDate(format(startOfMonth(new Date()), DATE_FORMAT_ISO))
        setEndDate(format(endOfMonth(new Date()), DATE_FORMAT_ISO))

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

    const handleViewDetails = async (date: string) => {
        setSelectedDateStr(date)
        setDetailsModalOpen(true)
        setHasChanges(false)

        const start = `${date}T00:00:00`
        const end = `${date}T23:59:59`

        try {
            const res = await fetch(`/api/admin/reports?userId=${selectedUser}&startDate=${start}&endDate=${end}`)
            const data = await res.json()

            // Map to editable format
            const editable = data.map((e: RawEntry) => ({
                id: e.id,
                type: e.type,
                timeStr: format(new Date(e.timestamp), TIME_FORMAT_HM),
                originalTimeStr: format(new Date(e.timestamp), TIME_FORMAT_HM),
                originalType: e.type
            }))

            // Sort Descending (Latest first)
            editable.sort((a: EditableEntry, b: EditableEntry) => b.timeStr.localeCompare(a.timeStr))

            setLocalEntries(editable)
        } catch (error) {
            console.error(error)
            setLocalEntries([])
        }
    }

    const handleLocalUpdate = (id: number | string, field: 'timeStr' | 'type', value: string) => {
        setLocalEntries(prev => {
            const updated = prev.map(e => {
                if (e.id === id) {
                    return { ...e, [field]: value }
                }
                return e
            })
            return updated
        })
        setHasChanges(true)
    }

    const handleLocalDelete = (id: number | string) => {
        setLocalEntries(prev => prev.filter(e => e.id !== id))
        setHasChanges(true)
    }

    const handleSmartAdd = () => {
        setLocalEntries(prev => {
            const sorted = [...prev].sort((a, b) => b.timeStr.localeCompare(a.timeStr))
            const topEntry = sorted[0] // Latest

            const newEntries: EditableEntry[] = []

            // Helper to add minutes
            const addMinutes = (time: string, mins: number) => {
                const [h, m] = time.split(':').map(Number)
                const date = new Date()
                date.setHours(h, m + mins)
                return format(date, TIME_FORMAT_HM)
            }

            const subtractMinutes = (time: string, mins: number) => {
                const [h, m] = time.split(':').map(Number)
                const date = new Date()
                date.setHours(h, m - mins)
                return format(date, TIME_FORMAT_HM)
            }

            if (!topEntry) {
                // 6.5 No data -> New Entry (CLOCK_IN)
                newEntries.push({
                    id: `new-${Date.now()}`,
                    type: TYPE_CLOCK_IN,
                    timeStr: '09:00',
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                })
            } else if (topEntry.type === TYPE_CLOCK_IN) {
                // 6.4 Entry -> Generate Out
                newEntries.push({
                    id: `new-${Date.now()}`,
                    type: TYPE_CLOCK_OUT,
                    timeStr: addMinutes(topEntry.timeStr, MINUTES_8_HOURS), // +8h
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                })
            } else if (topEntry.type === TYPE_BREAK_START) {
                // 6.3 Break Start -> Generate Break End
                newEntries.push({
                    id: `new-${Date.now()}`,
                    type: TYPE_BREAK_END,
                    timeStr: addMinutes(topEntry.timeStr, MINUTES_30_MINS),
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                })
            } else if (topEntry.type === TYPE_BREAK_END) {
                // 6.2 Break End -> Generate Out
                newEntries.push({
                    id: `new-${Date.now()}`,
                    type: TYPE_CLOCK_OUT,
                    timeStr: addMinutes(topEntry.timeStr, MINUTES_4_HOURS), // +4h
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                })
            } else if (topEntry.type === TYPE_CLOCK_OUT) {
                // 6.1 Out -> Generate Break Start & End BEFORE Out
                const breakEnd = {
                    id: `new-${Date.now()}-1`,
                    type: TYPE_BREAK_END,
                    timeStr: subtractMinutes(topEntry.timeStr, MINUTES_2_HOURS),
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                }
                const breakStart = {
                    id: `new-${Date.now()}-2`,
                    type: TYPE_BREAK_START,
                    timeStr: subtractMinutes(topEntry.timeStr, MINUTES_2_5_HOURS),
                    originalTimeStr: '',
                    originalType: '',
                    isNew: true
                }
                newEntries.push(breakEnd, breakStart)
            }

            return [...prev, ...newEntries].sort((a, b) => b.timeStr.localeCompare(a.timeStr))
        })
        setHasChanges(true)
    }

    const validateEntries = (entries: EditableEntry[]) => {
        // Sort Ascending for validation logic
        const sorted = [...entries].sort((a, b) => a.timeStr.localeCompare(b.timeStr))

        const ins = sorted.filter(e => e.type === TYPE_CLOCK_IN)
        const outs = sorted.filter(e => e.type === TYPE_CLOCK_OUT)

        // 5.3 Only 1 In, 1 Out
        if (ins.length > 1) return 'Solo puede haber una Entrada.'
        if (outs.length > 1) return 'Solo puede haber una Salida.'

        // 5.1 In at bottom (First in Ascending)
        if (ins.length > 0 && sorted[0].type !== TYPE_CLOCK_IN) return 'La Entrada debe ser el primer registro.'

        // 5.2 Out at top (Last in Ascending)
        if (outs.length > 0 && sorted.at(-1)?.type !== TYPE_CLOCK_OUT) return 'La Salida debe ser el último registro.'

        // Logical sequence check
        for (let i = 0; i < sorted.length - 1; i++) {
            const curr = sorted[i]
            const next = sorted[i + 1]

            if (curr.type === TYPE_CLOCK_IN && next.type === TYPE_BREAK_END) return 'No puede haber Fin Pausa después de Entrada.'
            if (curr.type === TYPE_BREAK_START && next.type === TYPE_CLOCK_OUT) return 'No puede haber Salida después de Inicio Pausa (falta Fin Pausa).'
        }

        return null
    }

    const handleSaveChanges = async () => {
        const error = validateEntries(localEntries)
        if (error) {
            // alert(error) - Sonar violation
            console.warn(error)
            return
        }

        // Fetch current DB state for this day to know what to delete
        const start = `${selectedDateStr}T00:00:00`
        const end = `${selectedDateStr}T23:59:59`
        const res = await fetch(`/api/admin/reports?userId=${selectedUser}&startDate=${start}&endDate=${end}`)
        const dbEntries: RawEntry[] = await res.json()

        const localIds = new Set(localEntries.map(e => e.id))
        const toDelete = dbEntries.filter((e) => !localIds.has(e.id))

        // Execute Deletes
        for (const entry of toDelete) {
            await fetch(`/api/admin/entries/${entry.id}`, { method: 'DELETE' })
        }

        // Execute Updates/Creates
        for (const entry of localEntries) {
            const timestamp = `${selectedDateStr}T${entry.timeStr}:00`

            if (typeof entry.id === 'string' && entry.id.startsWith('new-')) {
                // Create
                await fetch('/api/admin/entries', {
                    method: 'POST',
                    headers: API_JSON_HEADER,
                    body: JSON.stringify({
                        userId: selectedUser,
                        type: entry.type,
                        timestamp
                    })
                })
            } else if (entry.timeStr !== entry.originalTimeStr || entry.type !== entry.originalType) {
                // Update if changed
                await fetch(`/api/admin/entries/${entry.id}`, {
                    method: 'PUT',
                    headers: API_JSON_HEADER,
                    body: JSON.stringify({
                        type: entry.type,
                        timestamp
                    })
                })
            }
        }

        setDetailsModalOpen(false)
        generateReport() // Refresh main report
    }

    const renderStatus = (row: DailyReport) => {
        if (!row.isWorkDay) return <span className="text-gray-400">-</span>
        if (row.compliant) {
            return (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Cumplido
                </span>
            )
        }
        return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                Incumplido
            </span>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Informe de Cumplimiento Horario</h1>

            <div className="bg-white p-6 rounded-lg shadow mb-8 flex gap-4 items-end">
                <div>
                    <label htmlFor="user-select" className="block text-sm font-bold mb-2">Usuario</label>
                    <select
                        id="user-select"
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
                    <label htmlFor="start-date" className="block text-sm font-bold mb-2">Desde</label>
                    <input
                        id="start-date"
                        type="date"
                        className="border p-2 rounded"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-bold mb-2">Hasta</label>
                    <input
                        id="end-date"
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
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
                                        {renderStatus(row)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <button
                                            onClick={() => handleViewDetails(row.date)}
                                            className="text-blue-600 hover:text-blue-900 underline"
                                        >
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {detailsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Detalles del Día: {selectedDateStr}</h2>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={handleSmartAdd}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                                + Añadir Registro
                            </button>
                        </div>

                        <table className="min-w-full mb-6">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {localEntries.map((entry, index) => {
                                    // Chronologically previous entry (since list is descending, next index is earlier)
                                    const prevEntry = localEntries[index + 1]
                                    const isAfterClockIn = prevEntry?.type === TYPE_CLOCK_IN
                                    const isAfterBreakStart = prevEntry?.type === TYPE_BREAK_START
                                    const isAfterBreakEnd = prevEntry?.type === TYPE_BREAK_END

                                    return (
                                        <tr key={entry.id}>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="time"
                                                    aria-label="Hora"
                                                    className="border p-1 rounded"
                                                    value={entry.timeStr}
                                                    onChange={(e) => handleLocalUpdate(entry.id, 'timeStr', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <select
                                                    aria-label="Tipo"
                                                    className="border p-1 rounded w-full"
                                                    value={entry.type}
                                                    onChange={(e) => handleLocalUpdate(entry.id, 'type', e.target.value)}
                                                    disabled={entry.type === TYPE_CLOCK_IN} // 5.6 Never edit Entry type
                                                >
                                                    {/* Only show CLOCK_IN if it doesn't exist elsewhere or this IS the CLOCK_IN entry. AND NOT after Break Start */}
                                                    {(!isAfterBreakStart && (!localEntries.some(e => e.type === TYPE_CLOCK_IN) || entry.type === TYPE_CLOCK_IN)) && (
                                                        <option value={TYPE_CLOCK_IN}>Entrada (CLOCK_IN)</option>
                                                    )}

                                                    {/* Hide BREAK_START if previous entry is BREAK_START */}
                                                    {!isAfterBreakStart && (
                                                        <option value={TYPE_BREAK_START}>Inicio Pausa (BREAK_START)</option>
                                                    )}

                                                    {/* Hide BREAK_END if previous entry is CLOCK_IN or BREAK_END */}
                                                    {!isAfterClockIn && !isAfterBreakEnd && (
                                                        <option value={TYPE_BREAK_END}>Fin Pausa (BREAK_END)</option>
                                                    )}

                                                    {/* Hide CLOCK_OUT if previous entry is BREAK_START */}
                                                    {!isAfterBreakStart && (
                                                        <option value={TYPE_CLOCK_OUT}>Salida (CLOCK_OUT)</option>
                                                    )}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={() => handleLocalDelete(entry.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {localEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                                            No hay registros. Añade uno nuevo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setDetailsModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={!hasChanges}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
