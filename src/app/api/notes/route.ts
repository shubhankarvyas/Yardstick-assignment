import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'

// In-memory notes storage for deployment compatibility
let NOTES: any[] = [
  {
    id: 'note-1',
    title: 'Welcome to Acme Notes',
    content: 'This is your first note in the Acme tenant.',
    userId: 'acme-admin',
    tenantId: 'acme-tenant',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    user: { id: 'acme-admin', email: 'admin@acme.test', role: 'ADMIN' }
  },
  {
    id: 'note-2',
    title: 'Getting Started',
    content: 'You can create, edit, and delete notes. Notes are isolated by tenant.',
    userId: 'acme-user',
    tenantId: 'acme-tenant',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z'),
    user: { id: 'acme-user', email: 'user@acme.test', role: 'MEMBER' }
  },
  {
    id: 'note-3',
    title: 'Globex Welcome',
    content: 'Welcome to Globex Corporation notes.',
    userId: 'globex-admin',
    tenantId: 'globex-tenant',
    createdAt: new Date('2024-01-15T12:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z'),
    user: { id: 'globex-admin', email: 'admin@globex.test', role: 'ADMIN' }
  }
]

// GET /api/notes - List all notes for the current tenant
export const GET = withAuth(async (request) => {
  try {
    // Filter notes by tenant
    const tenantNotes = NOTES.filter(note => note.tenantId === request.user.tenantId)
    
    return NextResponse.json({ notes: tenantNotes })
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
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check subscription limits for FREE plan (simulated)
    const tenantNotes = NOTES.filter(note => note.tenantId === request.user.tenantId)
    
    if (tenantNotes.length >= 3) {
      return NextResponse.json(
        { 
          error: 'Note limit reached. Upgrade to Pro plan for unlimited notes.',
          code: 'NOTE_LIMIT_REACHED'
        },
        { status: 403 }
      )
    }

    const newNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      userId: request.user.userId,
      tenantId: request.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: request.user.userId,
        email: request.user.email,
        role: request.user.role
      }
    }

    NOTES.push(newNote)

    return NextResponse.json({ note: newNote }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})