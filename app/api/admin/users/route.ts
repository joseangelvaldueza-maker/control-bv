import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            include: { schedulePlan: true }
        })
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, pin, username, password, role } = body

        const user = await prisma.user.create({
            data: {
                name,
                email,
                pin,
                username,
                password,
                role: role || 'USER',
                schedulePlanId: body.schedulePlanId ? parseInt(body.schedulePlanId) : null
            },
            include: {
                schedulePlan: true
            }
        })
        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 })
    }
}
