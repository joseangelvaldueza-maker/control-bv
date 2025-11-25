'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        // Simple check: if not on login page and no user in localStorage, redirect
        // In a real app, verify session with API
        const user = localStorage.getItem('adminUser')
        if (!user && pathname !== '/admin') {
            router.push('/admin')
        } else if (user) {
            setIsAuthenticated(true)
        }
    }, [pathname, router])

    const handleLogout = () => {
        localStorage.removeItem('adminUser')
        setIsAuthenticated(false)
        router.push('/admin')
    }

    if (pathname === '/admin') {
        return <>{children}</>
    }

    if (!isAuthenticated) return null

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className="w-64 bg-gray-800 text-white p-6">
                <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
                <nav className="space-y-4">
                    <Link href="/admin/dashboard" className={`block p-2 rounded hover:bg-gray-700 ${pathname === '/admin/dashboard' ? 'bg-gray-700' : ''}`}>
                        Dashboard / Informes
                    </Link>
                    <Link href="/admin/users" className={`block p-2 rounded hover:bg-gray-700 ${pathname === '/admin/users' ? 'bg-gray-700' : ''}`}>
                        Usuarios
                    </Link>
                    <Link href="/admin/schedules" className={`block p-2 rounded hover:bg-gray-700 ${pathname === '/admin/schedules' ? 'bg-gray-700' : ''}`}>
                        Horarios
                    </Link>
                    <Link href="/admin/reports/compliance" className={`block p-2 rounded hover:bg-gray-700 ${pathname === '/admin/reports/compliance' ? 'bg-gray-700' : ''}`}>
                        Informe Cumplimiento
                    </Link>
                </nav>
                <button onClick={handleLogout} className="mt-8 w-full bg-red-600 hover:bg-red-700 p-2 rounded">
                    Cerrar Sesión
                </button>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                {children}
            </main>
        </div>
    )
}
