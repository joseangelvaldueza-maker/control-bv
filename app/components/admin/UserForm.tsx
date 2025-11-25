'use client'

import { useState, useEffect } from 'react'

interface UserFormProps {
    user?: any
    onSave: () => void
    onCancel: () => void
}

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        pin: '',
        username: '',
        password: '',
        role: 'USER',
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                pin: user.pin || '',
                username: user.username || '',
                password: user.password || '',
                role: user.role || 'USER',
            })
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users'
        const method = user ? 'PUT' : 'POST'

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        onSave()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="block text-sm">Nombre</label>
                        <input
                            className="w-full border p-1 rounded"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm">Email</label>
                        <input
                            className="w-full border p-1 rounded"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm">PIN</label>
                        <input
                            className="w-full border p-1 rounded"
                            value={formData.pin}
                            onChange={e => setFormData({ ...formData, pin: e.target.value })}
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block text-sm">Rol</label>
                        <select
                            className="w-full border p-1 rounded"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="USER">Usuario</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    {formData.role === 'ADMIN' && (
                        <>
                            <div className="mb-2">
                                <label className="block text-sm">Usuario (Login)</label>
                                <input
                                    className="w-full border p-1 rounded"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm">Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full border p-1 rounded"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
