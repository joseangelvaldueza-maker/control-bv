import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const body = await request.json()
        const { type, timestamp } = body

        const entry = await prisma.timeEntry.update({
            where: { id: parseInt(id) },
            data: {
                type,
                timestamp: new Date(timestamp)
            }
        })
        return NextResponse.json(entry)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating entry' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        await prisma.timeEntry.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting entry' }, { status: 500 })
    }
}
