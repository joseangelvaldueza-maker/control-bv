import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user || user.password !== password || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Credenciales inválidas o no autorizado' }, { status: 401 })
        }

        // In a real app, we would set a session cookie here.
        // For simplicity, we return the user object and handle state in the frontend.
        return NextResponse.json({ success: true, user })
    } catch (error) {
        return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
    }
}
