import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize database with seed data on first connection
let isInitialized = false

export async function ensureDatabase() {
  if (isInitialized) return
  
  try {
    // Check if database is already seeded
    const tenantCount = await prisma.tenant.count()
    
    if (tenantCount === 0) {
      console.log('Seeding database...')
      
      // Create tenants
      const acmeTenant = await prisma.tenant.create({
        data: {
          slug: 'acme',
          name: 'Acme Corporation',
          subscriptionPlan: 'FREE',
        },
      })

      const globexTenant = await prisma.tenant.create({
        data: {
          slug: 'globex',
          name: 'Globex Corporation',
          subscriptionPlan: 'FREE',
        },
      })

      // Hash password for all test accounts
      const hashedPassword = await bcrypt.hash('password', 10)

      // Create users for Acme
      await prisma.user.create({
        data: {
          email: 'admin@acme.test',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: acmeTenant.id,
        },
      })

      await prisma.user.create({
        data: {
          email: 'user@acme.test',
          password: hashedPassword,
          role: 'MEMBER',
          tenantId: acmeTenant.id,
        },
      })

      // Create users for Globex
      await prisma.user.create({
        data: {
          email: 'admin@globex.test',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: globexTenant.id,
        },
      })

      await prisma.user.create({
        data: {
          email: 'user@globex.test',
          password: hashedPassword,
          role: 'MEMBER',
          tenantId: globexTenant.id,
        },
      })

      console.log('Database seeded successfully')
    }
    
    isInitialized = true
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}