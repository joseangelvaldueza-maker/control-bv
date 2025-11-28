import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, type, timestamp } = body

        const entry = await prisma.timeEntry.create({
            data: {
                userId: parseInt(userId),
                type,
                timestamp: new Date(timestamp)
            }
        })
        return NextResponse.json(entry)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating entry' }, { status: 500 })
    }
}
