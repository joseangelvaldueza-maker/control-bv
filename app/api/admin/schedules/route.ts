import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const plans = await prisma.schedulePlan.findMany({
            include: { days: true },
            orderBy: { name: 'asc' },
        })
        return NextResponse.json(plans)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching plans' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, days } = body

        const plan = await prisma.schedulePlan.create({
            data: {
                name,
                days: {
                    create: days
                }
            },
            include: { days: true }
        })
        return NextResponse.json(plan)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating plan' }, { status: 500 })
    }
}
