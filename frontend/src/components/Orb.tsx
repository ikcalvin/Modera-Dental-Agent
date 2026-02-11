"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type OrbState = "speaking" | "listening" | "connecting" | "idle";

interface OrbProps {
  state: OrbState;
  className?: string;
}

export default function Orb({ state, className }: OrbProps) {
  // Map LiveKit/VoiceAssistant states to our visual states
  // Note: The parent component should pass the simplified state

  return (
    <div
      className={cn(
        "relative flex items-center justify-center h-64 w-64",
        className,
      )}
    >
      {/* 1. Ambient Rotation / Background Aura */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full opacity-30 blur-3xl bg-linear-to-tr from-teal-500/40 via-blue-600/40 to-purple-500/40"
      />

      {/* 2. Glow Rings (Expanding/Contracting) */}
      <motion.div
        variants={{
          idle: { scale: 1, opacity: 0.2 },
          connecting: {
            scale: [0.9, 1.1, 0.9],
            opacity: 0.3,
            transition: { duration: 2, repeat: Infinity },
          },
          listening: { scale: 1.05, opacity: 0.4 },
          speaking: {
            scale: [1, 1.2, 1],
            opacity: 0.6,
            transition: { duration: 0.5, repeat: Infinity },
          },
        }}
        animate={state}
        className="absolute h-48 w-48 rounded-full border border-teal-400/20 shadow-[0_0_30px_rgba(45,212,191,0.3)]"
      />

      <motion.div
        variants={{
          idle: { scale: 1, opacity: 0.1 },
          connecting: {
            scale: [0.8, 1.2, 0.8],
            opacity: 0.2,
            transition: { duration: 2.5, repeat: Infinity, delay: 0.2 },
          },
          listening: { scale: 1.1, opacity: 0.3 },
          speaking: {
            scale: [1, 1.3, 1],
            opacity: 0.4,
            transition: { duration: 0.5, repeat: Infinity, delay: 0.1 },
          },
        }}
        animate={state}
        className="absolute h-40 w-40 rounded-full border border-blue-400/20 shadow-[0_0_20px_rgba(96,165,250,0.3)]"
      />

      {/* 3. Core Orb */}
      <motion.div
        variants={{
          idle: { scale: 1 },
          connecting: {
            scale: [0.95, 1.05, 0.95],
            transition: { duration: 1.5, repeat: Infinity },
          },
          listening: {
            scale: 1,
            transition: { type: "spring", stiffness: 300 },
          },
          speaking: {
            scale: [1, 1.1, 1],
            transition: { duration: 0.3, repeat: Infinity },
          },
        }}
        animate={state}
        className="relative h-32 w-32 rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_20px_rgba(45,212,191,0.5)]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(45,212,191,1) 20%, rgba(15,118,110,1) 60%, rgba(2,6,23,1) 100%)",
        }}
      >
        {/* Internal noise/texture overlay if desired, or simpler gradient */}
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
      </motion.div>

      {/* 4. Particle Field (Floating dots) */}
      <Particles state={state} />
    </div>
  );
}

function Particles({ state }: { state: OrbState }) {
  // Simple particle system
  const particles = Array.from({ length: 8 });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={
            state === "speaking"
              ? {
                  x: [null, Math.random() * 200 - 100],
                  y: [null, Math.random() * 200 - 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }
              : {
                  y: [0, -10, 0],
                  opacity: [0.3, 0.6, 0.3],
                }
          }
          transition={{
            duration: state === "speaking" ? 0.5 : 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-teal-200 blur-[1px]"
        />
      ))}
    </div>
  );
}
