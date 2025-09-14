import { NextResponse } from 'next/server'
import { prisma, ensureDatabase } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

// GET /api/notes - List all notes for the current tenant
export const GET = withAuth(async (request) => {
  try {
    await ensureDatabase()
    
    const notes = await prisma.note.findMany({
      where: {
        tenantId: request.user.tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/notes - Create a new note
export const POST = withAuth(async (request) => {
  try {
    await ensureDatabase()
    
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check subscription limits for FREE plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.user.tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // If tenant is on FREE plan, check note limit
    if (tenant.subscriptionPlan === 'FREE') {
      const noteCount = await prisma.note.count({
        where: { tenantId: request.user.tenantId }
      })

      if (noteCount >= 3) {
        return NextResponse.json(
          { 
            error: 'Note limit reached. Upgrade to Pro plan for unlimited notes.',
            code: 'NOTE_LIMIT_REACHED'
          },
          { status: 403 }
        )
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: request.user.userId,
        tenantId: request.user.tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})