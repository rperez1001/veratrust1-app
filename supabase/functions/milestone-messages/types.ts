export interface Match {
  id: string
  user1_id: string
  user2_id: string
  match_date: string
  match_status: 'active' | 'blocked' | 'unmatched'
}

export interface Message {
  match_id: string
  sender_id: string
  content: string
  created_at?: string
}

export type MilestoneDay = 7 | 30 | 100

export const MILESTONES: MilestoneDay[] = [7, 30, 100]

export const MILESTONE_MESSAGES: Record<MilestoneDay, string> = {
  7: "🎉 It's been 7 days since your match! Want to celebrate with a voice note?",
  30: "🌟 One month of amazing conversations! How about sharing your favorite moment so far?",
  100: "💫 100 days of connection! You two have built something special. Time for a virtual celebration? 🥂"
} 