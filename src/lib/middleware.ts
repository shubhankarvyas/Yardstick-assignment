import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, type JWTPayload } from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload
}

export async function authenticate(request: NextRequest): Promise<{
  success: true;
  payload: JWTPayload;
} | {
  success: false;
  error: string;
  status: number;
}> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return {
        success: false,
        error: 'Authorization token required',
        status: 401
      }
    }

    const payload = verifyToken(token)
    
    return {
      success: true,
      payload
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Invalid or expired token',
      status: 401
    }
  }
}

export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = request.headers.get('authorization')
      const token = extractTokenFromHeader(authHeader)
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        )
      }

      const user = verifyToken(token)
      
      // Create a new request object with user data
      const authenticatedRequest = Object.assign(request, { user })
      
      return handler(authenticatedRequest as AuthenticatedRequest)
    } catch (error) {
      console.error('Authentication error:', error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  }
}

export function withRoleAuth(
  roles: Array<'ADMIN' | 'MEMBER'>,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    if (!roles.includes(request.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return handler(request)
  })
}