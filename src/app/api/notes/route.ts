import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    
    // Filter notes by tenant
    const tenantNotes = NOTES.filter(note => note.tenantId === payload.tenantId)
    
    return NextResponse.json({ notes: tenantNotes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const newNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      userId: payload.userId,
      tenantId: payload.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role
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
}