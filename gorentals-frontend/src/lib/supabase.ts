import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  // In dev/build, we might not have these yet, but we shouldn't crash unless they are used.
  console.warn('Supabase environment variables are missing. Realtime features will be disabled.')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Subscribes to real-time changes for a specific conversation.
 * 
 * @param conversationId The UUID of the conversation
 * @param onMessage Callback function for new messages
 * @returns An unsubscribe function
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: any) => void
) {
  if (!supabaseUrl || !supabaseKey) return () => {}

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages', // Note: the entity table name is chat_messages in Spring
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[Supabase Realtime] New message received:', payload.new)
        onMessage(payload.new)
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Subscription status for ${conversationId}:`, status)
    })

  return () => {
    console.log(`[Supabase Realtime] Unsubscribing from ${conversationId}`)
    supabase.removeChannel(channel)
  }
}
