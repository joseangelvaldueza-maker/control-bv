import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        include: { entries: true }
    })

    for (const user of users) {
        // Group by date
        const entriesByDate: Record<string, any[]> = {}
        for (const entry of user.entries) {
            const dateStr = format(entry.timestamp, 'yyyy-MM-dd')
            if (!entriesByDate[dateStr]) entriesByDate[dateStr] = []
            entriesByDate[dateStr].push(entry)
        }

        for (const [date, entries] of Object.entries(entriesByDate)) {
            const hasClockIn = entries.some(e => e.type === 'CLOCK_IN')
            const hasClockOut = entries.some(e => e.type === 'CLOCK_OUT')

            if (hasClockIn && !hasClockOut) {
                console.log(`Ejemplo encontrado:`)
                console.log(`Usuario: ${user.name}`)
                console.log(`Fecha: ${date}`)
                console.log(`Registros del día:`)
                entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                entries.forEach(e => {
                    console.log(` - ${format(e.timestamp, 'HH:mm:ss')} ${e.type}`)
                })
                return // Stop after first match
            }
        }
    }
    console.log('No se encontraron ejemplos (mala suerte con el random?).')
}

try {
    await main()
    await prisma.$disconnect()
} catch (e) {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
}
