import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware'

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (authRequest: AuthenticatedRequest) => {
    try {
      const { id: noteId } = await params

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId: authRequest.user.tenantId // Ensure tenant isolation
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

      // Find the note first to ensure it exists and belongs to the tenant
      const existingNote = await prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId: authRequest.user.tenantId
        }
      })

      if (!existingNote) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      // Check if user owns the note or is an admin
      if (existingNote.userId !== authRequest.user.userId && authRequest.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }

      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          title,
          content,
          updatedAt: new Date()
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

      return NextResponse.json({ note: updatedNote })
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

      // Find the note first to ensure it exists and belongs to the tenant
      const existingNote = await prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId: authRequest.user.tenantId
        }
      })

      if (!existingNote) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      // Check if user owns the note or is an admin
      if (existingNote.userId !== authRequest.user.userId && authRequest.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }

      await prisma.note.delete({
        where: { id: noteId }
      })

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