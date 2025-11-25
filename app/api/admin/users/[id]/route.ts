import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const body = await request.json()
        const { name, email, pin, username, password, role } = body

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                pin,
                username,
                password,
                role,
                schedulePlanId: body.schedulePlanId ? parseInt(body.schedulePlanId) : null
            },
            include: {
                schedulePlan: true
            }
        })
        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        // Optional: Delete related time entries first or use cascade in schema
        await prisma.timeEntry.deleteMany({
            where: { userId: parseInt(id) },
        })

        await prisma.user.delete({
            where: { id: parseInt(id) },
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 })
    }
}
