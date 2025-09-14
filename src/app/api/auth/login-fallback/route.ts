import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// In-memory test users for Vercel deployment
const TEST_USERS = [
  {
    id: 'acme-admin',
    email: 'admin@acme.test',
    password: '$2b$10$D.I6eKNAWbtfjZzPMoihD..aFUvl0G361yixpovGcyuYu2rtZpqjq', // 'password'
    role: 'ADMIN' as const,
    tenant: {
      id: 'acme-tenant',
      slug: 'acme',
      name: 'Acme Corporation',
      subscriptionPlan: 'FREE' as const
    }
  },
  {
    id: 'acme-user',
    email: 'user@acme.test',
    password: '$2b$10$D.I6eKNAWbtfjZzPMoihD..aFUvl0G361yixpovGcyuYu2rtZpqjq', // 'password'
    role: 'MEMBER' as const,
    tenant: {
      id: 'acme-tenant',
      slug: 'acme',
      name: 'Acme Corporation',
      subscriptionPlan: 'FREE' as const
    }
  },
  {
    id: 'globex-admin',
    email: 'admin@globex.test',
    password: '$2b$10$D.I6eKNAWbtfjZzPMoihD..aFUvl0G361yixpovGcyuYu2rtZpqjq', // 'password'
    role: 'ADMIN' as const,
    tenant: {
      id: 'globex-tenant',
      slug: 'globex',
      name: 'Globex Corporation',
      subscriptionPlan: 'FREE' as const
    }
  },
  {
    id: 'globex-user',
    email: 'user@globex.test',
    password: '$2b$10$D.I6eKNAWbtfjZzPMoihD..aFUvl0G361yixpovGcyuYu2rtZpqjq', // 'password'
    role: 'MEMBER' as const,
    tenant: {
      id: 'globex-tenant',
      slug: 'globex',
      name: 'Globex Corporation',
      subscriptionPlan: 'FREE' as const
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user in test data
    const user = TEST_USERS.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant.id,
      tenantSlug: user.tenant.slug
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant: user.tenant
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}