"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Calendar,
  Globe,
  Clock,
  CalendarCheck,
  Siren,
  UserRoundCog,
  MessageSquare,
  Bot,
  CheckCircle2,
  Sparkles,
  Smile,
  Crown,
  Stethoscope,
  Paintbrush,
  SunMedium,
  Cross,
  BriefcaseMedical,
} from "lucide-react";
import AgentModal from "@/components/AgentModal";
import BookingModal from "@/components/BookingModal";

/* -----------------------------------------------
   Data
   ----------------------------------------------- */

const STEPS = [
  {
    icon: MessageSquare,
    label: "Call or Chat",
    desc: "Call +1 443 252 8250 or tap Speak to Receptionist and the AI picks up instantly.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    icon: Bot,
    label: "AI Handles It",
    desc: "Book, reschedule, cancel appointments or ask questions in English or Spanish.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: CheckCircle2,
    label: "Instant Confirmation",
    desc: "Your appointment is confirmed on the spot and a text message is sent to your phone.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Our AI receptionist never sleeps. Schedule appointments, get answers, and handle emergencies any time, day or night.",
    color: "text-teal-400",
    glow: "rgba(45, 212, 191, 0.15)",
    glowBorder: "rgba(45, 212, 191, 0.25)",
  },
  {
    icon: Globe,
    title: "Bilingual Support",
    description:
      "Se habla espanol. Our AI converses fluently in both English and Spanish so every patient feels at home.",
    color: "text-blue-400",
    glow: "rgba(59, 130, 246, 0.15)",
    glowBorder: "rgba(59, 130, 246, 0.25)",
  },
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    description:
      "Book, reschedule, or cancel appointments entirely by voice. The AI walks you through each step and confirms every detail.",
    color: "text-violet-400",
    glow: "rgba(139, 92, 246, 0.15)",
    glowBorder: "rgba(139, 92, 246, 0.25)",
  },
  {
    icon: Siren,
    title: "Emergency Handling",
    description:
      "Urgent pain or injury? The AI triages your situation and fast-tracks you into a same-day emergency slot.",
    color: "text-rose-400",
    glow: "rgba(251, 113, 133, 0.15)",
    glowBorder: "rgba(251, 113, 133, 0.25)",
  },
  {
    icon: UserRoundCog,
    title: "Human Escalation",
    description:
      "Need a real person? The AI seamlessly transfers your call to front desk staff with no waiting and no repeating yourself.",
    color: "text-cyan-400",
    glow: "rgba(34, 211, 238, 0.15)",
    glowBorder: "rgba(34, 211, 238, 0.25)",
  },
];

const SERVICES = [
  { icon: Smile, label: "Orthodontics" },
  { icon: Stethoscope, label: "Family Dentistry" },
  { icon: Cross, label: "Dental Implants" },
  { icon: Paintbrush, label: "Cosmetic Dentistry" },
  { icon: SunMedium, label: "Teeth Whitening" },
  { icon: Crown, label: "Crowns" },
  { icon: BriefcaseMedical, label: "Root Canal" },
];

/* -----------------------------------------------
   Animations
   ----------------------------------------------- */

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
} as const;

/* -----------------------------------------------
   Page
   ----------------------------------------------- */

export default function Home() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-teal-500/30">
      {/* --- Navigation --- */}
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

      {/* --- Hero --- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center">
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
            provides comprehensive oral health solutions with an AI-powered
            receptionist available around the clock.
          </p>

          <div className="mt-8 mb-8 flex flex-col items-center gap-2">
            <a
              href="tel:+14432528250"
              className="text-xl font-semibold text-white hover:text-teal-400 transition-colors"
            >
              +1 443 252 8250
            </a>
            <span className="text-sm text-slate-500">
              Call anytime for appointments
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => setIsAgentOpen(true)}
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
      </section>

      {/* --- How It Works Infographic --- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <Sparkles size={14} className="text-teal-400" />
            How It Works
          </div>
          <h2 className="heading-gradient text-3xl font-bold sm:text-4xl">
            Three simple steps to your next appointment
          </h2>
        </motion.div>

        <div className="grid gap-16 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`relative flex flex-col items-center text-center ${
                i < STEPS.length - 1 ? "step-connector" : ""
              }`}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-teal-400 ring-2 ring-slate-700 md:-top-3 md:-right-3">
                {i + 1}
              </div>

              {/* Icon */}
              <div
                className={`icon-float mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border ${step.border} ${step.bg}`}
                style={{ animationDelay: `${i * 0.6}s` }}
              >
                <step.icon size={36} className={step.color} />
              </div>

              <h3 className="mb-2 text-xl font-semibold text-white">
                {step.label}
              </h3>
              <p className="max-w-xs text-sm text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <Sparkles size={14} className="text-teal-400" />
            AI-Powered Features
          </div>
          <h2 className="heading-gradient text-3xl font-bold sm:text-4xl">
            Everything your dental visit needs, automated
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Our intelligent receptionist handles the full appointment lifecycle
            so you never have to wait on hold again.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={cardVariants}>
              <FeatureCard
                icon={<f.icon className={f.color} size={24} />}
                title={f.title}
                description={f.description}
                glow={f.glow}
                glowBorder={f.glowBorder}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- Services --- */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <Sparkles size={14} className="text-teal-400" />
            Our Expertise
          </div>
          <h2 className="heading-gradient text-3xl font-bold sm:text-4xl">
            Comprehensive dental services
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            From routine cleanings to complex restorations, our team covers
            every aspect of your oral health.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {SERVICES.map((s) => (
            <motion.div
              key={s.label}
              variants={cardVariants}
              className="service-pill flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium text-slate-300 cursor-default"
            >
              <s.icon size={18} className="text-teal-400" />
              {s.label}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- CTA Banner --- */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/80 to-slate-800/40 px-8 py-16 text-center backdrop-blur-xl sm:px-16"
        >
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />

          <h2 className="relative z-10 text-3xl font-bold text-white sm:text-4xl">
            Ready to experience <br className="hidden sm:block" />
            <span className="text-teal-400">AI-powered dental care?</span>
          </h2>
          <p className="relative z-10 mx-auto mt-4 max-w-lg text-slate-400">
            Try our virtual receptionist now. Book an appointment in under 60
            seconds, completely hands-free.
          </p>

          <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => setIsAgentOpen(true)}
              className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-teal-500 to-teal-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105 hover:shadow-teal-500/40"
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
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/5 py-12 text-center text-sm text-slate-500">
        <div className="flex flex-col items-center gap-6">
          <a
            href="tel:+14432528250"
            className="text-lg font-semibold text-slate-400 hover:text-teal-400 transition-colors"
          >
            +1 443 252 8250
          </a>
          <p>&copy; 2026 Modera Dental Clinic. All rights reserved.</p>
        </div>
      </footer>

      <AgentModal isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </main>
  );
}

/* -----------------------------------------------
   Feature Card Component
   ----------------------------------------------- */

function FeatureCard({
  icon,
  title,
  description,
  glow,
  glowBorder,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  glow: string;
  glowBorder: string;
}) {
  return (
    <div
      className="feature-glow group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.04]"
      style={
        {
          "--glow-color": glow,
          "--glow-border": glowBorder,
        } as React.CSSProperties
      }
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
