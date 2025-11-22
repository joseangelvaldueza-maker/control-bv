import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, type, pin } = body

        if (!userId || !type) {
            return NextResponse.json({ error: 'Missing userId or type' }, { status: 400 })
        }

        // Optional: Verify PIN if provided
        if (pin) {
            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (user?.pin !== pin) {
                return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
            }
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId: parseInt(userId),
                type,
            },
        })

        return NextResponse.json(entry)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating entry' }, { status: 500 })
    }
}
