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
import { X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import Orb, { OrbState } from "./Orb";

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOKEN_TIMEOUT_MS = 15_000; // 15 seconds to get a token

export default function AgentModal({ isOpen, onClose }: AgentModalProps) {
  const [token, setToken] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchToken = useCallback(async () => {
    setError("");
    setIsLoading(true);

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout wrapper
    const timeout = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);

    try {
      const resp = await fetch("/api/token", { signal: controller.signal });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          throw new Error("Too many requests. Please wait a moment and try again.");
        }
        throw new Error(body.error || `Connection failed (${resp.status})`);
      }

      const data = await resp.json();
      if (!data.accessToken || !data.url) {
        throw new Error("Invalid server response. Please try again.");
      }

      setToken(data.accessToken);
      setUrl(data.url);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Connection timed out. Please check your internet and try again.");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to connect. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !token && !error) {
      fetchToken();
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen, token, error, fetchToken]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    setToken("");
    setError("");
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const onDisconnected = useCallback(() => {
    setToken("");
    onClose();
  }, [onClose]);

  const handleRetry = useCallback(() => {
    setToken("");
    setError("");
    fetchToken();
  }, [fetchToken]);

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
              onClick={handleClose}
              title="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
              {error ? (
                <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                  <div className="rounded-full bg-red-500/10 p-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-slate-300 text-sm">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw size={16} />
                    Try Again
                  </button>
                  <a
                    href="tel:+14432528250"
                    className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Or call us at +1 443 252 8250
                  </a>
                </div>
              ) : !token || isLoading ? (
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
                  <AgentContent />
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

function AgentContent() {
  const { state } = useVoiceAssistant();
  const connectionState = useConnectionState();

  // Map state to OrbState
  let orbState: OrbState = "idle";
  if (state === "speaking") orbState = "speaking";
  else if (state === "listening") orbState = "listening";
  else if (connectionState === ConnectionState.Connecting)
    orbState = "connecting";

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
    </div>
  );
}
