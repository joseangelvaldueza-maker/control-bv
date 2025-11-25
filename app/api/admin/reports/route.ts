import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    try {
        const where: any = {}

        if (userId) {
            where.userId = parseInt(userId)
        }

        if (startDate && endDate) {
            where.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            }
        }

        const entries = await prisma.timeEntry.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
        })

        return NextResponse.json(entries)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching reports' }, { status: 500 })
    }
}
