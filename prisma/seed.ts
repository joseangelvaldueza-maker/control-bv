import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const defaultPlan = await prisma.schedulePlan.create({
    data: {
      name: 'Plan Estándar (L-V 8h)',
      days: {
        create: [
          { dayOfWeek: 1, hours: 8 },
          { dayOfWeek: 2, hours: 8 },
          { dayOfWeek: 3, hours: 8 },
          { dayOfWeek: 4, hours: 8 },
          { dayOfWeek: 5, hours: 8 },
        ]
      }
    }
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      pin: '1234',
      role: 'USER',
      schedulePlanId: defaultPlan.id
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      pin: '5678',
      role: 'USER',
      schedulePlanId: defaultPlan.id
    },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      username: 'admin',
      password: 'admin123', // En producción usar hash
      role: 'ADMIN',
    },
  })

  console.log({ defaultPlan, user1, user2, admin })
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
