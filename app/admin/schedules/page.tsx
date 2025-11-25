'use client'

import { useState, useEffect } from 'react'

interface SchedulePlan {
    id: number
    name: string
    days: { dayOfWeek: number; hours: number }[]
}

export default function AdminSchedules() {
    const [plans, setPlans] = useState<SchedulePlan[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<SchedulePlan | undefined>(undefined)
    const [formData, setFormData] = useState({
        name: '',
        days: [] as { dayOfWeek: number; hours: number }[]
    })

    const fetchPlans = () => {
        fetch('/api/admin/schedules')
            .then(res => res.json())
            .then(setPlans)
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const handleEdit = (plan: SchedulePlan) => {
        setEditingPlan(plan)
        setFormData({
            name: plan.name,
            days: plan.days
        })
        setIsModalOpen(true)
    }

    const handleNew = () => {
        setEditingPlan(undefined)
        setFormData({ name: '', days: [] })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de borrar este plan?')) {
            await fetch(`/api/admin/schedules/${id}`, { method: 'DELETE' })
            fetchPlans()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = editingPlan ? `/api/admin/schedules/${editingPlan.id}` : '/api/admin/schedules'
        const method = editingPlan ? 'PUT' : 'POST'

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        setIsModalOpen(false)
        fetchPlans()
    }

    const toggleDay = (dayIndex: number) => {
        const exists = formData.days.find(d => d.dayOfWeek === dayIndex)
        if (exists) {
            setFormData({ ...formData, days: formData.days.filter(d => d.dayOfWeek !== dayIndex) })
        } else {
            setFormData({ ...formData, days: [...formData.days, { dayOfWeek: dayIndex, hours: 8 }] })
        }
    }

    const updateHours = (dayIndex: number, hours: number) => {
        setFormData({
            ...formData,
            days: formData.days.map(d => d.dayOfWeek === dayIndex ? { ...d, hours } : d)
        })
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestión de Horarios</h1>
                <button
                    onClick={handleNew}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Nuevo Plan
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Laborables</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {plans.map((plan) => (
                            <tr key={plan.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{plan.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {plan.days.length} días
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(plan)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(plan.id)} className="text-red-600 hover:text-red-900">Borrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Nombre del Plan</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-2">Días y Horas</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, index) => {
                                        const dayData = formData.days.find(d => d.dayOfWeek === index)
                                        return (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!dayData}
                                                    onChange={() => toggleDay(index)}
                                                />
                                                <span className="w-24 text-sm">{day}</span>
                                                {dayData && (
                                                    <>
                                                        <input
                                                            type="number"
                                                            className="w-16 border p-1 rounded text-sm"
                                                            value={dayData.hours}
                                                            onChange={(e) => updateHours(index, parseFloat(e.target.value))}
                                                        />
                                                        <span className="text-xs text-gray-500">h</span>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
