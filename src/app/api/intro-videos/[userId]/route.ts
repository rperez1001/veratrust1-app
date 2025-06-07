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

  // Check if user is admin or accessing their own video
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && session.user.id !== params.userId)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Get the video from storage
  const { data, error } = await supabase.storage
    .from('intro-videos')
    .download(`${params.userId}.mp4`)

  if (error) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Convert to blob and return with proper content type
  const blob = new Blob([data], { type: 'video/mp4' })
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes'
    }
  })
} 