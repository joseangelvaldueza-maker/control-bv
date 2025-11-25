import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Limpiar datos existentes
  await prisma.timeEntry.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.schedulePlan.deleteMany({})

  // 2. Crear Planes Horarios
  const planFull = await prisma.schedulePlan.create({
    data: {
      name: 'Jornada Completa (L-V 8h)',
      days: {
        create: [1, 2, 3, 4, 5].map(d => ({ dayOfWeek: d, hours: 8 }))
      }
    },
    include: { days: true }
  })

  const planMorning = await prisma.schedulePlan.create({
    data: {
      name: 'Media Jornada Mañana (L-V 4h)',
      days: {
        create: [1, 2, 3, 4, 5].map(d => ({ dayOfWeek: d, hours: 4 }))
      }
    },
    include: { days: true }
  })

  const planWeekend = await prisma.schedulePlan.create({
    data: {
      name: 'Fines de Semana (S-D 10h)',
      days: {
        create: [0, 6].map(d => ({ dayOfWeek: d, hours: 10 }))
      }
    },
    include: { days: true }
  })

  // 3. Crear Usuarios
  const usersData = [
    { name: 'Carlos Full', email: 'carlos@test.com', pin: '1001', planId: planFull.id },
    { name: 'Diana Full', email: 'diana@test.com', pin: '1002', planId: planFull.id },
    { name: 'Elena Media', email: 'elena@test.com', pin: '1003', planId: planMorning.id },
    { name: 'Fernando Media', email: 'fernando@test.com', pin: '1004', planId: planMorning.id },
    { name: 'Gabriel Finde', email: 'gabriel@test.com', pin: '1005', planId: planWeekend.id },
  ]

  const createdUsers = []
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { schedulePlanId: u.planId },
      create: {
        name: u.name,
        email: u.email,
        pin: u.pin,
        role: 'USER',
        schedulePlanId: u.planId
      }
    })
    createdUsers.push(user)
  }

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
    },
  })

  // 4. Simular Registros (Noviembre 2025)
  const year = 2025
  const month = 10 // Noviembre es índice 10 en JS Date
  const daysInMonth = 30

  console.log('Generando registros para Noviembre...')

  for (const user of createdUsers) {
    // Obtener días laborables del plan del usuario
    const plan = [planFull, planMorning, planWeekend].find(p => p.id === user.schedulePlanId)
    // @ts-ignore
    const workingDays = plan?.days.map(d => d.dayOfWeek) || [] // Simplificación, en realidad habría que consultar la DB o usar el objeto en memoria si tuviera los days incluidos

    // Hack: reconstruir mapa de horas
    let hoursMap: Record<number, number> = {}
    if (plan === planFull) hoursMap = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }
    if (plan === planMorning) hoursMap = { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 }
    if (plan === planWeekend) hoursMap = { 0: 10, 6: 10 }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()

      if (hoursMap[dayOfWeek]) {
        const expectedHours = hoursMap[dayOfWeek]

        // Aleatoriedad: 10% menos tiempo, 10% más tiempo, 80% puntual
        const rand = Math.random()
        let actualDuration = expectedHours
        let note = 'Puntual'

        if (rand < 0.1) {
          actualDuration = expectedHours - (Math.random() * 1.5) // Hasta 1.5h menos
          note = 'Menos tiempo'
        } else if (rand > 0.9) {
          actualDuration = expectedHours + (Math.random() * 1) // Hasta 1h más
          note = 'Más tiempo'
        }

        // Hora de entrada base: 9:00 AM (o aleatoria entre 8:30 y 9:30)
        const startHour = 9 + (Math.random() * 0.5 - 0.25) // 8:45 - 9:15
        const startTime = new Date(year, month, day, Math.floor(startHour), (startHour % 1) * 60)

        // Clock In
        await prisma.timeEntry.create({
          data: { userId: user.id, type: 'CLOCK_IN', timestamp: startTime }
        })

        // Break (si jornada > 5h)
        let breakDuration = 0
        if (expectedHours > 5) {
          const breakStart = new Date(startTime.getTime() + 4 * 60 * 60 * 1000) // 4h después de entrar
          await prisma.timeEntry.create({
            data: { userId: user.id, type: 'BREAK_START', timestamp: breakStart }
          })

          breakDuration = 0.5 + Math.random() * 0.5 // 30-60 min
          const breakEnd = new Date(breakStart.getTime() + breakDuration * 60 * 60 * 1000)
          await prisma.timeEntry.create({
            data: { userId: user.id, type: 'BREAK_END', timestamp: breakEnd }
          })
        }

        // Clock Out
        // Tiempo total trabajo = (Fin - Inicio) - Descanso
        // Fin = Inicio + Trabajo + Descanso
        const endTime = new Date(startTime.getTime() + (actualDuration + breakDuration) * 60 * 60 * 1000)
        await prisma.timeEntry.create({
          data: { userId: user.id, type: 'CLOCK_OUT', timestamp: endTime }
        })
      }
    }
  }

  console.log('Datos generados correctamente.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
