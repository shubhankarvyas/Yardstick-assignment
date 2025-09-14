import { PrismaClient, Role, SubscriptionPlan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create tenants
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      slug: 'acme',
      name: 'Acme Corporation',
      subscriptionPlan: SubscriptionPlan.FREE,
    },
  })

  const globexTenant = await prisma.tenant.upsert({
    where: { slug: 'globex' },
    update: {},
    create: {
      slug: 'globex',
      name: 'Globex Corporation',
      subscriptionPlan: SubscriptionPlan.FREE,
    },
  })

  console.log('Created tenants:', { acmeTenant, globexTenant })

  // Hash password for all test accounts
  const hashedPassword = await bcrypt.hash('password', 10)

  // Create users for Acme
  const acmeAdmin = await prisma.user.upsert({
    where: { 
      email_tenantId: {
        email: 'admin@acme.test',
        tenantId: acmeTenant.id
      }
    },
    update: {},
    create: {
      email: 'admin@acme.test',
      password: hashedPassword,
      role: Role.ADMIN,
      tenantId: acmeTenant.id,
    },
  })

  const acmeUser = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'user@acme.test',
        tenantId: acmeTenant.id
      }
    },
    update: {},
    create: {
      email: 'user@acme.test',
      password: hashedPassword,
      role: Role.MEMBER,
      tenantId: acmeTenant.id,
    },
  })

  // Create users for Globex
  const globexAdmin = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'admin@globex.test',
        tenantId: globexTenant.id
      }
    },
    update: {},
    create: {
      email: 'admin@globex.test',
      password: hashedPassword,
      role: Role.ADMIN,
      tenantId: globexTenant.id,
    },
  })

  const globexUser = await prisma.user.upsert({
    where: {
      email_tenantId: {
        email: 'user@globex.test',
        tenantId: globexTenant.id
      }
    },
    update: {},
    create: {
      email: 'user@globex.test',
      password: hashedPassword,
      role: Role.MEMBER,
      tenantId: globexTenant.id,
    },
  })

  console.log('Created users:', { acmeAdmin, acmeUser, globexAdmin, globexUser })

  console.log('Seeding finished.')
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