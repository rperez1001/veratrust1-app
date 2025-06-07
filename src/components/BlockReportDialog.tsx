import { useState } from 'react'
import { AlertTriangle, Ban } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface BlockReportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUserId: string
  targetUserName: string
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment or bullying',
  'Fake profile',
  'Spam or scam',
  'Underage user',
  'Other'
]

export default function BlockReportDialog({
  isOpen,
  onClose,
  targetUserId,
  targetUserName
}: BlockReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReport = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reported_user_id: targetUserId,
          reason: selectedReason,
          details
        })

      if (error) throw error

      toast.success('Report submitted successfully')
      onClose()
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBlock = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocked_user_id: targetUserId
        })

      if (error) throw error

      // Also update any existing matches to blocked status
      await supabase
        .from('matches')
        .update({ status: 'blocked' })
        .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`)

      toast.success(`Blocked ${targetUserName}`)
      onClose()
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Failed to block user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block or Report {targetUserName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Block User */}
          <div>
            <button
              onClick={handleBlock}
              disabled={isSubmitting}
              className="flex items-center gap-2 w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Ban className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium">Block User</h3>
                <p className="text-sm text-gray-600">
                  They won't be able to message you or see your profile
                </p>
              </div>
            </button>
          </div>

          {/* Report User */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium">Report User</h3>
            </div>

            <div className="space-y-4">
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select a reason</option>
                {REPORT_REASONS.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide additional details..."
                className="w-full p-2 border rounded-lg h-24 resize-none"
              />

              <button
                onClick={handleReport}
                disabled={isSubmitting}
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 