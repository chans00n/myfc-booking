'use client'

import { Button } from '@/components/ui/button'
import { PhoneOff, FileText, User, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConsultationControlsProps {
  onEndCall: () => void
  onToggleNotes: () => void
  onToggleClientInfo: () => void
  isAdmin: boolean
}

export function ConsultationControls({
  onEndCall,
  onToggleNotes,
  onToggleClientInfo,
  isAdmin
}: ConsultationControlsProps) {
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const handleEndCall = () => {
    setShowEndDialog(true)
  }

  const confirmEndCall = () => {
    setShowEndDialog(false)
    onEndCall()
  }

  return (
    <>
      <div className="border-t bg-card flex-shrink-0">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          {/* Left side - Media controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              size="sm"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>
            
            <Button
              size="sm"
              variant={isVideoOff ? "destructive" : "secondary"}
              onClick={() => setIsVideoOff(!isVideoOff)}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
            </Button>
          </div>

          {/* Center - Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleClientInfo}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Client Info</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleNotes}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Notes</span>
              </Button>
            </div>
          )}

          {/* Right side - End call */}
          <div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndCall}
              className="h-8 sm:h-9 px-2 sm:px-3"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden xs:inline ml-1">End Call</span>
            </Button>
          </div>
        </div>
      </div>

      {/* End Call Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Consultation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this consultation? Make sure you have saved any important notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndCall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Consultation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}