import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRoleAuth, type AuthenticatedRequest } from '@/lib/middleware'

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  return withRoleAuth(['ADMIN'], async (authRequest: AuthenticatedRequest) => {
    try {
      const { slug: tenantSlug } = await params
      
      if (!tenantSlug) {
        return NextResponse.json(
          { error: 'Tenant slug is required' },
          { status: 400 }
        )
      }

      // Verify that the authenticated user belongs to the tenant they're trying to upgrade
      if (authRequest.user.tenantSlug !== tenantSlug) {
        return NextResponse.json(
          { error: 'Cannot upgrade other tenants' },
          { status: 403 }
        )
      }

      // Update tenant subscription to PRO
      const updatedTenant = await prisma.tenant.update({
        where: { slug: tenantSlug },
        data: { subscriptionPlan: 'PRO' }
      })

      return NextResponse.json({
        message: 'Tenant upgraded to Pro plan successfully',
        tenant: {
          id: updatedTenant.id,
          slug: updatedTenant.slug,
          name: updatedTenant.name,
          subscriptionPlan: updatedTenant.subscriptionPlan
        }
      })
    } catch (error) {
      console.error('Upgrade error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}