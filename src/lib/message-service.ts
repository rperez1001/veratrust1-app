import { supabase } from './supabase'

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface LatestMessage {
  match_id: string
  last_message_id: string
  last_message_content: string
  last_message_sender_id: string
  last_message_created_at: string
}

export async function sendMessage(matchId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(
  matchId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .rpc('get_match_messages', {
      match_id_param: matchId,
      limit_val: limit,
      before_timestamp: beforeTimestamp
    })

  if (error) throw error
  return data || []
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}

export async function getLatestMessages(limit: number = 20): Promise<LatestMessage[]> {
  const { data, error } = await supabase
    .rpc('get_latest_messages_by_matches', {
      user_id_param: (await supabase.auth.getUser()).data.user?.id,
      limit_val: limit
    })

  if (error) throw error
  return data || []
}

// Real-time subscription to new messages in a match
export function subscribeToMatchMessages(
  matchId: string,
  callback: (message: Message) => void
): () => void {
  const subscription = supabase
    .channel(`match_${matchId}_messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      },
      (payload) => {
        callback(payload.new as Message)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

// Real-time subscription to latest messages across all matches
export function subscribeToLatestMessages(
  callback: (message: Message) => void
): () => void {
  const subscription = supabase
    .channel(`user_latest_messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      async (payload) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: match } = await supabase
            .from('matches')
            .select('id')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .eq('id', payload.new.match_id)
            .single()

          if (match) {
            callback(payload.new as Message)
          }
        }
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
} 
