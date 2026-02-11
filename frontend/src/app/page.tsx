"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Globe, ShieldCheck, Clock } from "lucide-react";
import AgentModal from "@/components/AgentModal";
import BookingModal from "@/components/BookingModal";

export default function Home() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 z-40 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-teal-400 to-blue-500" />
            <span className="text-lg font-bold tracking-tight">
              Modera Dental
            </span>
          </div>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 sm:block transition-colors"
          >
            Client Portal
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500"></span>
            </span>
            Accepting New Patients for 2026
          </div>

          <h1 className="bg-linear-to-b from-white to-white/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            Experience the Future <br /> of{" "}
            <span className="text-teal-400">Dental Care</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Leading-edge technology meets compassionate care. Modera Dental
            provides comprehensive oral health solutions with a patient-first
            approach.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => {
                console.log("Opening Agent Modal");
                setIsAgentOpen(true);
              }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-teal-500 to-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105 hover:shadow-teal-500/40"
            >
              <Phone
                size={18}
                className="transition-transform group-hover:rotate-12"
              />
              Speak to Receptionist
            </button>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <Calendar size={18} />
              Book Online
            </button>
          </div>
        </motion.div>

        {/* Floating UI Card Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative mt-20 w-full max-w-5xl rounded-t-3xl border border-white/10 bg-slate-900/50 p-2 shadow-2xl glass backdrop-blur-xl"
        >
          <div className="overflow-hidden rounded-t-2xl bg-slate-950">
            {/* Placeholder for the AI Generated Abstract 3D Image */}
            <div className="relative aspect-21/9 w-full bg-slate-900 overflow-hidden">
              {/* Fallback Abstract Gradient since Image Gen Failed */}
              <div className="absolute inset-0 bg-linear-to-br from-teal-900/40 via-blue-900/20 to-slate-900/50"></div>

              {/* Abstract Shapes to mimic the 3D look */}
              <div className="absolute top-1/2 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-teal-500/20 blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"></div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass p-8 rounded-2xl border border-white/10 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Patient Dashboard
                  </h3>
                  <p className="text-slate-400">
                    AI-Powered Insights & Real-time Scheduling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Clock className="text-teal-400" />}
            title="24/7 Availability"
            description="Our AI receptionist is always awake to schedule your appointment, answer questions, and handle emergencies."
          />
          <FeatureCard
            icon={<Globe className="text-blue-400" />}
            title="Bilingual Support"
            description="Se habla español. Our systems interact fluently in both English and Spanish to serve our diverse community."
          />
          <FeatureCard
            icon={<ShieldCheck className="text-purple-400" />}
            title="Insurance Verification"
            description="Instant preliminary checks on your insurance coverage and transparent pricing estimates."
          />
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-sm text-slate-500">
        <p>&copy; 2026 Modera Dental Clinic. All rights reserved.</p>
      </footer>

      <AgentModal isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-8 hover:bg-white/4 transition-colors">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
