import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const userId = parseInt(id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    try {
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId,
                timestamp: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            orderBy: { timestamp: 'desc' },
        })

        const hasClockIn = entries.some((e) => e.type === 'CLOCK_IN')
        const hasClockOut = entries.some((e) => e.type === 'CLOCK_OUT')
        const lastEntry = entries[0]

        let status = 'NOT_STARTED'
        if (hasClockOut) {
            status = 'DONE'
        } else if (hasClockIn) {
            if (lastEntry.type === 'BREAK_START') {
                status = 'ON_BREAK'
            } else {
                status = 'WORKING'
            }
        }

        return NextResponse.json({ status, hasClockIn })
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching status' }, { status: 500 })
    }
}
