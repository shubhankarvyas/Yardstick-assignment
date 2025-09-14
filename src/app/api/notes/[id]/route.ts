import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// Shared in-memory notes storage (should match the one in route.ts)
// In a real app, this would be in a shared module or database
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

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (authRequest: AuthenticatedRequest) => {
    try {
      const { id: noteId } = await params

      const note = NOTES.find(n => 
        n.id === noteId && n.tenantId === authRequest.user.tenantId
      )

      if (!note) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ note })
    } catch (error) {
      console.error('Get note error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// PUT /api/notes/[id] - Update a specific note
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (authRequest: AuthenticatedRequest) => {
    try {
      const { id: noteId } = await params
      const { title, content } = await authRequest.json()

      if (!title || !content) {
        return NextResponse.json(
          { error: 'Title and content are required' },
          { status: 400 }
        )
      }

      const noteIndex = NOTES.findIndex(n => 
        n.id === noteId && n.tenantId === authRequest.user.tenantId
      )

      if (noteIndex === -1) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      const existingNote = NOTES[noteIndex]

      // Check if user owns the note or is an admin
      if (existingNote.userId !== authRequest.user.userId && authRequest.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }

      // Update the note
      NOTES[noteIndex] = {
        ...existingNote,
        title,
        content,
        updatedAt: new Date()
      }

      return NextResponse.json({ note: NOTES[noteIndex] })
    } catch (error) {
      console.error('Update note error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// DELETE /api/notes/[id] - Delete a specific note
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (authRequest: AuthenticatedRequest) => {
    try {
      const { id: noteId } = await params

      const noteIndex = NOTES.findIndex(n => 
        n.id === noteId && n.tenantId === authRequest.user.tenantId
      )

      if (noteIndex === -1) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      const existingNote = NOTES[noteIndex]

      // Check if user owns the note or is an admin
      if (existingNote.userId !== authRequest.user.userId && authRequest.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }

      // Delete the note
      NOTES.splice(noteIndex, 1)

      return NextResponse.json({ message: 'Note deleted successfully' })
    } catch (error) {
      console.error('Delete note error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}