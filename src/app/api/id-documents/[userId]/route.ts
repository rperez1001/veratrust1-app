import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Only admins can access ID documents
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Get the ID document from storage
  const { data, error } = await supabase.storage
    .from('id-documents')
    .download(`${params.userId}.jpg`)

  if (error) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Convert to blob and return with proper content type
  const blob = new Blob([data], { type: 'image/jpeg' })
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-cache'
    }
  })
} 