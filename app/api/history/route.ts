import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    try {
        const where = userId ? { userId: parseInt(userId) } : {}

        const entries = await prisma.timeEntry.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 20,
            include: {
                user: {
                    select: { name: true }
                }
            }
        })
        return NextResponse.json(entries)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching history' }, { status: 500 })
    }
}
