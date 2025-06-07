'use client'

import { useState } from 'react'
import { VideoCall, initiateVideoCall } from '@/lib/premium-service'
import { DayPicker } from 'react-day-picker'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { addDays, format, setHours, setMinutes } from 'date-fns'

interface CallSchedulerProps {
  receiverId: string
  receiverName: string
  onScheduled?: (call: VideoCall) => void
}

export default function CallScheduler({
  receiverId,
  receiverName,
  onScheduled
}: CallSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableTimes = Array.from({ length: 24 }, (_, i) => {
    const hour = i + 9 // Start from 9 AM
    if (hour >= 24) return null // Skip hours after midnight
    return {
      value: `${hour}:00`,
      label: format(setHours(new Date(), hour), 'h:mm a')
    }
  }).filter((time): time is { value: string; label: string } => time !== null)

  const handleSchedule = async () => {
    if (!date || !time) {
      setError('Please select both date and time')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [hours, minutes] = time.split(':').map(Number)
      const scheduledDateTime = setMinutes(setHours(date, hours), minutes)

      const call = await initiateVideoCall(receiverId, scheduledDateTime.toISOString())
      onScheduled?.(call)
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule call')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full"
      >
        Schedule Video Call
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule a Video Call</DialogTitle>
            <DialogDescription>
              Schedule a 5-minute intro call with {receiverName}. Choose a date and
              time that works for you.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <DayPicker
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date() || date > addDays(new Date(), 14)}
                className="rounded-md border"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Time</label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((timeSlot) => (
                    <SelectItem
                      key={timeSlot.value}
                      value={timeSlot.value}
                    >
                      {timeSlot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!date || !time || loading}
            >
              {loading ? 'Scheduling...' : 'Schedule Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 