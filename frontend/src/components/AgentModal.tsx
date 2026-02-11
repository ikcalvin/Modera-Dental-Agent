"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Orb, { OrbState } from "./Orb";
// import clsx from "clsx";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  const [token, setToken] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && !token) {
      (async () => {
        try {
          const resp = await fetch("/api/token");
          const data = await resp.json();
          setToken(data.accessToken);
          setUrl(data.url);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [isOpen, token]);

  const onDisconnected = useCallback(() => {
    setToken("");
    onClose();
  }, [onClose]);

  console.log("AgentModal Render, isOpen:", isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl glass-card"
          >
            <button
              onClick={onClose}
              title="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
              {token === "" ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                  <p className="text-slate-400">
                    Connecting to Receptionist...
                  </p>
                </div>
              ) : (
                <LiveKitRoom
                  token={token}
                  serverUrl={url}
                  connect={true}
                  audio={true}
                  video={false}
                  onDisconnected={onDisconnected}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <AgentContent onClose={onClose} />
                  <RoomAudioRenderer />
                  <StartAudio
                    label="Click to Allow Audio"
                    className="bg-teal-600 text-white px-6 py-2 rounded-full font-medium hover:bg-teal-500 transition-colors"
                  />
                </LiveKitRoom>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AgentContent({ onClose }: { onClose: () => void }) {
  const { state } = useVoiceAssistant();
  const connectionState = useConnectionState();

  /*
   * Removing manual disconnection check as LiveKitRoom handles it via onDisconnected prop.
   * The initial render state is Disconnected, which was causing immediate closure.
   */
  useEffect(() => {
    // LiveKitRoom handles disconnection mostly, but we can double check or log
    // removed the immediate onClose on Disconnected to avoid premature closing
  }, [connectionState]);

  // Map state to OrbState
  let orbState: OrbState = "idle";
  if (state === "speaking") orbState = "speaking";
  else if (state === "listening") orbState = "listening";
  else if (connectionState === ConnectionState.Connecting)
    orbState = "connecting";

  // const toggleMute = () => {
  //   // This is a placeholder for local mute logic if needed,
  //   // though LiveKitRoom manages published tracks.
  //   // Real implementation would toggle the local audio track.
  //   setIsMuted(!isMuted);
  // };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="relative flex items-center justify-center py-10">
        <Orb state={orbState} />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-white">
          Modera AI Receptionist
        </h3>
        <p className="text-slate-400 text-sm">
          {state === "listening"
            ? "Listening..."
            : state === "speaking"
              ? "Speaking..."
              : "Connected"}
        </p>
      </div>

      {/* 
        <div className="flex gap-4">
            <button 
                onClick={toggleMute}
                className={clsx(
                    "p-4 rounded-full transition-all border border-white/10",
                    isMuted ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-white/5 text-teal-400 hover:bg-white/10"
                )}
            >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
        </div> 
       */}
    </div>
  );
}
