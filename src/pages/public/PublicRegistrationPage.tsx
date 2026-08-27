import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface PublicRegistrationPageProps {
  eventSlug?: string;
}

export const PublicRegistrationPage: React.FC<PublicRegistrationPageProps> = ({ eventSlug }) => {
  const { events, registerAttendee, navigateTo, activeEvent: defaultActiveEvent, addToast } = useApp();

  // Find event by slug or fallback
  const event = events.find((e) => e.slug === eventSlug) || defaultActiveEvent || events[0];

  // Dynamic form state
  const [formData, setFormData] = useState<Record<string, string>>({
    f_name: '',
    f_email: '',
    f_phone: '',
    f_company: '',
    f_designation: '',
    f_city: event?.city || '',
    f_delegatetype: 'General Attendee',
    f_diet: 'South Indian Vegetarian',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">The requested event page could not be located.</p>
          <Button className="mt-4" onClick={() => navigateTo('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const totalRegs = event.stats?.totalRegistrations ?? 0;
  const capacity = event.settings?.capacity || 1;
  const capacityPct = Math.round((totalRegs / capacity) * 100);
  const remaining = Math.max(0, (event.settings?.capacity || 0) - totalRegs);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newAttendee = registerAttendee(event.id, {
        fullName: formData.f_name || 'Registered Delegate',
        email: formData.f_email || 'delegate@example.com',
        phone: formData.f_phone || '+91 98000 00000',
        company: formData.f_company || 'Independent',
        jobTitle: formData.f_designation || 'Attendee',
        city: formData.f_city || event.city,
        ticketType: formData.f_delegatetype || 'General Attendee',
        customAnswers: formData,
      });

      // Launch celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }

      setIsSubmitting(false);
      // Navigate to success screen
      navigateTo(`/e/${event.slug}/pass/${newAttendee.id}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs"
            style={{ backgroundColor: event.branding.primaryColor || '#4f46e5' }}
          >
            EF
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900">
            {event.organizationName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: event.name, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                addToast({
                  type: 'success',
                  title: 'Link Copied',
                  description: 'Registration link copied to clipboard.',
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={() => navigateTo('/app')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Organizer Login
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Event Hero & Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Event Cover Image */}
            {event.branding.coverImageUrl && (
              <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-video relative bg-slate-900">
                <img
                  src={event.branding.coverImageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                    {event.category}
                  </span>
                </div>
              </div>
            )}

            {/* Event Title & Metadata Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {event.name}
              </h1>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{event.description}</p>

              {/* Date & Location Highlights */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{formatDate(event.date)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.startTime} - {event.endTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{event.venueName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.venueAddress || event.city}</p>
                  </div>
                </div>
              </div>

              {/* Event Tags */}
              {event.settings.tags && event.settings.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                  {event.settings.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer Info Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organized By</p>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{event.organizerName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{event.organizerEmail} • {event.organizerContact}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                {event.organizerName.charAt(0)}
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-7 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delegate Registration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Instant QR badge generation</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Free Entry
                </span>
              </div>

              {/* Live Capacity Meter */}
              <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
                  <span>Registration Status</span>
                  <span className="text-indigo-600">{capacityPct}% Full</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, capacityPct)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {remaining} seats remaining of {event.settings.capacity.toLocaleString()} capacity limit.
                </p>
              </div>

              {/* Dynamic Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {event.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'dropdown' ? (
                      <select
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.id]: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select option...</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-1.5 mt-1">
                        {field.options?.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={formData[field.id] === opt}
                              onChange={(e) =>
                                setFormData({ ...formData, [field.id]: e.target.value })
                              }
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${(field.label || '').toLowerCase()}`}
                        value={formData[field.id] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.id]: e.target.value })
                        }
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full shadow-md"
                    style={{ backgroundColor: event.branding.primaryColor || '#4f46e5' }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Confirm Registration & Get QR Pass
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant WhatsApp & Email pass confirmation</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
