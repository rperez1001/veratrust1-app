'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { VideoCall as VideoCallType, updateVideoCallStatus } from '@/lib/premium-service'
import { Button } from './ui/button'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface VideoCallProps {
  call: VideoCallType
  onEnd?: () => void
}

export default function VideoCall({ call, onEnd }: VideoCallProps) {
  const videoRef = useRef<HTMLIFrameElement>(null)
  const callInstance = useRef<any>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!call.room_id) {
      setError('Invalid room configuration')
      return
    }

    const startCall = async () => {
      try {
        if (!videoRef.current) return

        // Create Daily call instance
        callInstance.current = await DailyIframe.createFrame(videoRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px'
          },
          showLeaveButton: false,
          showFullscreenButton: true
        })

        // Join the call
        await callInstance.current.join({
          url: `https://veratrust.daily.co/${call.room_id}`,
          userName: 'User' // TODO: Add actual user name
        })

        // Update call status
        await updateVideoCallStatus(call.id, 'accepted', {
          started_at: new Date().toISOString()
        })

        // Set up event listeners
        callInstance.current.on('participant-joined', handleParticipantUpdate)
        callInstance.current.on('participant-left', handleParticipantUpdate)
        callInstance.current.on('error', handleError)

      } catch (err) {
        setError('Failed to start video call')
        console.error('Video call error:', err)
      }
    }

    startCall()

    return () => {
      if (callInstance.current) {
        callInstance.current.destroy()
      }
    }
  }, [call.room_id])

  const handleParticipantUpdate = () => {
    if (callInstance.current) {
      setParticipants(Object.values(callInstance.current.participants()))
    }
  }

  const handleError = (err: Error) => {
    setError(err.message)
    console.error('Daily.co error:', err)
  }

  const toggleAudio = () => {
    if (callInstance.current) {
      const newState = !isAudioMuted
      callInstance.current.setLocalAudio(!newState)
      setIsAudioMuted(newState)
    }
  }

  const toggleVideo = () => {
    if (callInstance.current) {
      const newState = !isVideoMuted
      callInstance.current.setLocalVideo(!newState)
      setIsVideoMuted(newState)
    }
  }

  const endCall = async () => {
    try {
      if (callInstance.current) {
        await callInstance.current.leave()
      }

      await updateVideoCallStatus(call.id, 'completed', {
        ended_at: new Date().toISOString()
      })

      onEnd?.()
    } catch (err) {
      console.error('Error ending call:', err)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onEnd}>Close</Button>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Video Container */}
      <div ref={videoRef} className="w-full h-full" />

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleAudio}
            variant={isAudioMuted ? 'destructive' : 'secondary'}
            size="icon"
          >
            {isAudioMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoMuted ? 'destructive' : 'secondary'}
            size="icon"
          >
            {isVideoMuted ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </Button>

          <Button
            onClick={endCall}
            variant="destructive"
            className="px-6"
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Participant Count */}
      <div className="absolute top-4 right-4 bg-black/30 px-3 py-1 rounded-full text-sm text-white flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {participants.length} participant{participants.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
} 