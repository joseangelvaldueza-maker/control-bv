import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const body = await request.json()
        const { name, days } = body

        const plan = await prisma.schedulePlan.update({
            where: { id: parseInt(id) },
            data: {
                name,
                days: {
                    deleteMany: {},
                    create: days
                }
            },
            include: { days: true }
        })
        return NextResponse.json(plan)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating plan' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        await prisma.schedulePlan.delete({
            where: { id: parseInt(id) },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting plan' }, { status: 500 })
    }
}
