import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const { userId, pin } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        })

        if (!user || user.pin !== pin) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
        }

        return NextResponse.json({ success: true, user })
    } catch (error) {
        return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
    }
}
