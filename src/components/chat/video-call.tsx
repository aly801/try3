import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneOff, Video, Mic, MicOff, VideoOff } from "lucide-react";
import { useWebsocket } from "@/hooks/use-websocket";

interface Props {
  roomId: number;
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VideoCall({ roomId, userId, open, onOpenChange }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const { sendSignal, subscribe } = useWebsocket(userId);

  useEffect(() => {
    if (!open) {
      endCall();
      return;
    }

    startCall();

    const unsubscribe = subscribe(async (msg) => {
      if (msg.type === "signal" && msg.roomId === roomId && msg.userId !== userId) {
        const signal = msg.signal;
        
        if (!peerConnectionRef.current) {
          await initializePeerConnection();
        }
        const pc = peerConnectionRef.current!;

        try {
          if (signal.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal(roomId, pc.localDescription);
          } else if (signal.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          }
        } catch (err) {
          console.error("Error processing signal:", err);
        }
      }
    });

    return () => {
      unsubscribe();
      endCall();
    };
  }, [open, roomId, userId]);

  const initializePeerConnection = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(roomId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = await initializePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(roomId, pc.localDescription);
    } catch (err) {
      console.error("Error accessing media devices.", err);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-none text-white">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent border-none">
          <DialogTitle className="text-white">Video Call</DialogTitle>
        </DialogHeader>

        <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center">
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              Waiting for others to join...
            </div>
          )}
          
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-4 right-4 w-48 aspect-video bg-neutral-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
            />
            {isVideoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                <VideoOff className="w-8 h-8 text-white/50" />
              </div>
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full">
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full h-12 w-12 border-none ${isMicMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={toggleMic}
            >
              {isMicMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full h-12 w-12 border-none ${isVideoMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={toggleVideo}
            >
              {isVideoMuted ? <VideoOff /> : <Video />}
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              className="rounded-full h-12 w-12 ml-4 hover:bg-red-600"
              onClick={() => onOpenChange(false)}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
