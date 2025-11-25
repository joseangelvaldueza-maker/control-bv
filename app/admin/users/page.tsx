'use client'

import { useState, useEffect } from 'react'
import UserForm from '../../components/admin/UserForm'

interface User {
    id: number
    name: string
    email: string
    role: string
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined)

    const fetchUsers = () => {
        fetch('/api/admin/users')
            .then(res => res.json())
            .then(setUsers)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de borrar este usuario?')) {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            fetchUsers()
        }
    }

    const handleSave = () => {
        setIsModalOpen(false)
        setEditingUser(undefined)
        fetchUsers()
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">Borrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UserForm
                    user={editingUser}
                    onSave={handleSave}
                    onCancel={() => { setIsModalOpen(false); setEditingUser(undefined) }}
                />
            )}
        </div>
    )
}
