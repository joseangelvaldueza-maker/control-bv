import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay, eachDayOfInterval, format, getDay } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!userId || !from || !to) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: {
                schedulePlan: {
                    include: { days: true }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const startDate = startOfDay(new Date(from))
        const endDate = endOfDay(new Date(to))

        // Get all time entries for the period
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: parseInt(userId),
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { timestamp: 'asc' }
        })

        // Generate all days in interval
        const days = eachDayOfInterval({ start: startDate, end: endDate })

        const report = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayOfWeek = getDay(day) // 0=Sunday, 1=Monday...

            // Find scheduled hours
            // @ts-ignore
            const scheduleDay = user.schedulePlan?.days.find(d => d.dayOfWeek === dayOfWeek)
            const expectedHours = scheduleDay ? scheduleDay.hours : 0

            // Calculate actual hours
            const dayEntries = entries.filter(e => format(e.timestamp, 'yyyy-MM-dd') === dateStr)
            let workedMilliseconds = 0
            let lastClockIn = null

            for (const entry of dayEntries) {
                if (entry.type === 'CLOCK_IN') {
                    lastClockIn = entry.timestamp
                } else if (entry.type === 'CLOCK_OUT' && lastClockIn) {
                    workedMilliseconds += entry.timestamp.getTime() - lastClockIn.getTime()
                    lastClockIn = null
                } else if (entry.type === 'BREAK_START' && lastClockIn) {
                    // Stop counting work when break starts
                    workedMilliseconds += entry.timestamp.getTime() - lastClockIn.getTime()
                    lastClockIn = null
                } else if (entry.type === 'BREAK_END') {
                    // Resume counting work
                    lastClockIn = entry.timestamp
                }
            }

            // If still clocked in (or on break without end), ignore pending time for report or handle as needed
            // For this report, we only count closed intervals or up to now if needed.
            // Simplified: only closed intervals.

            const actualHours = workedMilliseconds / (1000 * 60 * 60)

            return {
                date: dateStr,
                dayOfWeek,
                expectedHours,
                actualHours,
                compliant: actualHours >= expectedHours,
                isWorkDay: expectedHours > 0
            }
        })

        return NextResponse.json(report)

    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error generating report' }, { status: 500 })
    }
}
