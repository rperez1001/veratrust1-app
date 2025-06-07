import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Match, Message, MilestoneDay, MILESTONES, MILESTONE_MESSAGES } from './types.ts'

interface MilestoneCheck {
  match: Match
  milestone: MilestoneDay
}

serve(async (_req: Request) => {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const systemUserId = Deno.env.get('SYSTEM_USER_ID')

    if (!supabaseUrl || !supabaseKey || !systemUserId) {
      throw new Error('Missing required environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get active matches
    const { data: matches, error: matchError } = await supabaseClient
      .from('matches')
      .select('id, user1_id, user2_id, match_date, match_status')
      .eq('match_status', 'active')

    if (matchError) {
      throw new Error(`Failed to fetch matches: ${matchError.message}`)
    }

    const now = new Date()
    const milestonesToProcess: MilestoneCheck[] = []

    // Check each match for milestones
    for (const match of matches as Match[]) {
      const matchDate = new Date(match.match_date)
      const daysDiff = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24))

      // Check if today is a milestone day
      const milestone = MILESTONES.find(m => m === daysDiff) as MilestoneDay | undefined
      if (milestone) {
        milestonesToProcess.push({ match, milestone })
      }
    }

    // Prepare messages to send
    const messagesToSend: Message[] = milestonesToProcess.map(({ match, milestone }) => ({
      match_id: match.id,
      sender_id: systemUserId,
      content: MILESTONE_MESSAGES[milestone],
      created_at: new Date().toISOString()
    }))

    // Check if we already sent milestone messages today
    if (messagesToSend.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: existingMessages, error: checkError } = await supabaseClient
        .from('messages')
        .select('match_id')
        .eq('sender_id', systemUserId)
        .gte('created_at', today.toISOString())
        .in(
          'match_id',
          messagesToSend.map(m => m.match_id)
        )

      if (checkError) {
        throw new Error(`Failed to check existing messages: ${checkError.message}`)
      }

      // Filter out matches that already received a message today
      const existingMatchIds = new Set((existingMessages || []).map(m => m.match_id))
      const newMessages = messagesToSend.filter(m => !existingMatchIds.has(m.match_id))

      // Insert new milestone messages
      if (newMessages.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('messages')
          .insert(newMessages)

        if (insertError) {
          throw new Error(`Failed to insert messages: ${insertError.message}`)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          processedMatches: milestonesToProcess.length,
          sentMessages: newMessages.length,
          skippedMessages: messagesToSend.length - newMessages.length
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedMatches: matches.length,
        sentMessages: 0,
        skippedMessages: 0
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error in milestone messages function:', errorMessage)

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 