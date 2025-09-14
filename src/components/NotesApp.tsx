'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    role: string
  }
}

export default function NotesApp() {
  const { user, token, logout } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNote, setNewNote] = useState({ title: '', content: '' })

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }

      const data = await response.json()
      setNotes(data.notes)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchNotes()
    }
  }, [token, fetchNotes])

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.title.trim() || !newNote.content.trim()) return

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.code === 'NOTE_LIMIT_REACHED') {
          alert('Note limit reached! Upgrade to Pro plan for unlimited notes.')
          return
        }
        throw new Error(errorData.error || 'Failed to create note')
      }

      const data = await response.json()
      setNotes([data.note, ...notes])
      setNewNote({ title: '', content: '' })
      setShowCreateForm(false)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) return

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingNote.title,
          content: editingNote.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }

      const data = await response.json()
      setNotes(notes.map((note: Note) => note.id === editingNote.id ? data.note : note))
      setEditingNote(null)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }

      setNotes(notes.filter((note: Note) => note.id !== noteId))
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleUpgradeTenant = async () => {
    if (!user?.tenant.slug) return

    try {
      const response = await fetch(`/api/tenants/${user.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upgrade tenant')
      }

      alert('Successfully upgraded to Pro plan!')
      // Refresh the page to update the user context
      window.location.reload()
    } catch (error: unknown) {
      alert(`Upgrade failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading notes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.tenant.name} Notes
              </h1>
              <p className="text-sm text-gray-600">
                {user?.email} ({user?.role}) - {user?.tenant.subscriptionPlan} Plan
              </p>
            </div>
            <div className="flex space-x-4">
              {user?.tenant.subscriptionPlan === 'FREE' && user?.role === 'ADMIN' && (
                <button
                  onClick={handleUpgradeTenant}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                New Note
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Create Note Form */}
        {showCreateForm && (
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Create New Note</h2>
            <form onSubmit={handleCreateNote}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <textarea
                  placeholder="Note content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Create Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewNote({ title: '', content: '' })
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Note Form */}
        {editingNote && (
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Edit Note</h2>
            <form onSubmit={handleUpdateNote}>
              <div className="mb-4">
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Update Note
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Notes ({notes.length})</h2>
            {user?.tenant.subscriptionPlan === 'FREE' && (
              <p className="text-sm text-gray-600">
                Free plan: {notes.length}/3 notes used
              </p>
            )}
          </div>
          
          {notes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No notes yet. Create your first note!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notes.map((note: Note) => (
                <div key={note.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="text-sm text-gray-500">
                        Created by {note.user.email} on{' '}
                        {new Date(note.createdAt).toLocaleDateString()}
                        {note.updatedAt !== note.createdAt && (
                          <span>
                            {' '}
                            (Updated {new Date(note.updatedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {(note.user.id === user?.id || user?.role === 'ADMIN') && (
                        <>
                          <button
                            onClick={() => setEditingNote(note)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}