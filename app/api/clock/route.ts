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

        // Validate one entry per day
        if (type === 'CLOCK_IN') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const existingEntry = await prisma.timeEntry.findFirst({
                where: {
                    userId: parseInt(userId),
                    type: 'CLOCK_IN',
                    timestamp: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
            })

            if (existingEntry) {
                return NextResponse.json({ error: 'Ya has registrado tu entrada hoy.' }, { status: 400 })
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
