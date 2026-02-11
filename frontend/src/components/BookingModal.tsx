"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SERVICE_TYPES = [
  "Orthodontics Consultation",
  "Routine Checkup",
  "Dental Implants Consultation",
  "Cosmetic Dentistry Consultation",
  "Teeth Whitening",
  "Crown Fitting",
  "Root Canal Treatment",
  "New Patient Exam",
  "Emergency / Same-Day",
];

const URGENCY_LEVELS = ["Low", "Medium", "High"];

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    service_type: SERVICE_TYPES[1], // Default to Routine Checkup
    datetime: "",
    reason: "",
    urgency: "Medium",
    is_new_customer: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const payload = {
        tool: "create_appointment",
        args: {
          customer: {
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            is_new_customer: formData.is_new_customer,
          },
          appointment: {
            service_type: formData.service_type,
            datetime: formData.datetime,
            reason: formData.reason,
            urgency: formData.urgency,
          },
          source: "web_booking_form",
        },
      };

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit booking");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle"); // Reset for next time
        setFormData({ ...formData, reason: "", datetime: "" }); // Clear some fields
      }, 3000); // Close after 3 seconds of success message
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again or call us.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl glass-card my-8"
          >
            <button
              onClick={onClose}
              title="Close"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Book Appointment
                  </h2>
                  <p className="text-sm text-slate-400">
                    Schedule your visit with Modera Dental
                  </p>
                </div>
              </div>

              {status === "success" ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-teal-500/20 p-4 text-teal-400">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-xl font-medium text-white">
                    Booking Confirmed!
                  </h3>
                  <p className="mt-2 text-slate-400">
                    We have received your request. You will receive a
                    confirmation shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="full_name"
                        className="text-xs font-medium text-slate-400"
                      >
                        Full Name *
                      </label>
                      <input
                        id="full_name"
                        required
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label
                        htmlFor="phone"
                        className="text-xs font-medium text-slate-400"
                      >
                        Phone *
                      </label>
                      <input
                        id="phone"
                        required
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium text-slate-400"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="service_type"
                        className="text-xs font-medium text-slate-400"
                      >
                        Service Type
                      </label>
                      <select
                        id="service_type"
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all"
                      >
                        {SERVICE_TYPES.map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="bg-slate-900"
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">
                        Urgency
                      </label>
                      <div className="flex gap-2">
                        {URGENCY_LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                urgency: level,
                              }))
                            }
                            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                              formData.urgency === level
                                ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                                : "bg-black/20 border-white/10 text-slate-400 hover:bg-white/5"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">
                      Preferred Date & Time *
                    </label>
                    <input
                      required
                      type="datetime-local"
                      name="datetime"
                      id="datetime"
                      min={new Date(
                        new Date().getTime() -
                          new Date().getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)}
                      value={formData.datetime}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const now = new Date();

                        // Check if specific time is selected (not just valid date string)
                        if (!isNaN(selectedDate.getTime())) {
                          const day = selectedDate.getDay();
                          const hours = selectedDate.getHours();
                          const minutes = selectedDate.getMinutes();
                          const timeValue = hours + minutes / 60;

                          if (selectedDate < now) {
                            setErrorMessage(
                              "Please select a future date and time.",
                            );
                            setStatus("error");
                          } else if (day === 0 || day === 6) {
                            setErrorMessage(
                              "We are closed on weekends. Please choose a weekday.",
                            );
                            setStatus("error");
                          } else if (timeValue < 9.5 || timeValue >= 17) {
                            setErrorMessage(
                              "Our hours are Mon-Fri, 9:30 AM - 5:00 PM.",
                            );
                            setStatus("error");
                          } else {
                            setErrorMessage("");
                            setStatus("idle");
                          }
                        }

                        handleChange(e);
                      }}
                      onClick={(e) =>
                        (e.target as HTMLInputElement).showPicker()
                      }
                      style={{ colorScheme: "dark" }}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">
                      Reason for Visit
                    </label>
                    <textarea
                      rows={3}
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all resize-none"
                      placeholder="Describe any symptoms or specific requests..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_new_customer"
                      id="is_new_customer"
                      checked={formData.is_new_customer}
                      onChange={handleChange}
                      className="rounded border-white/10 bg-black/20 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-0"
                    />
                    <label
                      htmlFor="is_new_customer"
                      className="text-sm text-slate-400 select-none cursor-pointer"
                    >
                      I am a new patient
                    </label>
                  </div>

                  {status === "error" && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                      <AlertCircle size={16} />
                      <p>{errorMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full rounded-full bg-linear-to-r from-teal-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] hover:shadow-teal-500/40 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
