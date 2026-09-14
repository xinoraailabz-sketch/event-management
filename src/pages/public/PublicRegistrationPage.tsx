import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { mapDbToEvent } from '@/lib/db-mappers';
import { EventItem } from '@/types';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Share2,
  Loader2,
  UploadCloud,
  FileText,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { uploadMediaToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface PublicRegistrationPageProps {
  eventSlug?: string;
}

export const PublicRegistrationPage: React.FC<PublicRegistrationPageProps> = ({ eventSlug }) => {
  const { events, registerAttendee, navigateTo, activeEvent: defaultActiveEvent, addToast, isLoading: appLoading } = useApp();

  const cleanSlug = React.useMemo(() => {
    if (!eventSlug) return '';
    return eventSlug.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
  }, [eventSlug]);

  const [directFetchedEvent, setDirectFetchedEvent] = useState<EventItem | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState<boolean>(false);
  const [liveRegCount, setLiveRegCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic form state
  const [formData, setFormData] = useState<Record<string, string>>({
    f_name: '',
    f_email: '',
    f_phone: '',
    f_company: '',
    f_designation: '',
    f_city: '',
    f_delegatetype: 'General Attendee',
    f_diet: 'South Indian Vegetarian',
  });

  // Track file upload states per field
  const [fileUploadState, setFileUploadState] = useState<
    Record<
      string,
      {
        isUploading: boolean;
        fileName?: string;
        previewUrl?: string;
        error?: string;
      }
    >
  >({});

  const handleFileUpload = async (fieldId: string, file: File) => {
    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
      });
      return;
    }

    const isImage = file.type.startsWith('image/');
    const localPreview = isImage ? URL.createObjectURL(file) : undefined;

    setFileUploadState((prev) => ({
      ...prev,
      [fieldId]: {
        isUploading: true,
        fileName: file.name,
        previewUrl: localPreview,
      },
    }));

    try {
      const secureUrl = await uploadMediaToCloudinary(
        file,
        'eventflow_attendee_uploads',
        `att_${event?.slug || 'file'}`
      );

      if (secureUrl) {
        setFormData((prev) => ({
          ...prev,
          [fieldId]: secureUrl,
          ...(isImage && !prev.avatarUrl ? { avatarUrl: secureUrl } : {}),
        }));

        setFileUploadState((prev) => ({
          ...prev,
          [fieldId]: {
            isUploading: false,
            fileName: file.name,
            previewUrl: secureUrl,
          },
        }));

        addToast({
          type: 'success',
          title: 'File Uploaded',
          description: `${file.name} uploaded successfully.`,
          duration: 3000,
        });
      } else {
        throw new Error('Could not upload file to storage.');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      setFileUploadState((prev) => ({
        ...prev,
        [fieldId]: {
          isUploading: false,
          error: 'Upload failed. Please try again.',
        },
      }));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: err.message || 'Could not upload file.',
      });
    }
  };

  const handleClearFile = (fieldId: string) => {
    setFormData((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setFileUploadState((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  // Find in memory or use directly fetched event
  const event =
    events.find((e) => e.slug === cleanSlug) ||
    directFetchedEvent ||
    (defaultActiveEvent?.slug === cleanSlug ? defaultActiveEvent : null);

  // Fetch directly from Supabase if not found in memory
  useEffect(() => {
    if (!cleanSlug) return;
    const existing = events.find((e) => e.slug === cleanSlug);
    if (!existing) {
      setIsFetchingDirect(true);
      (async () => {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('slug', cleanSlug)
            .maybeSingle();
          if (data && !error) {
            setDirectFetchedEvent(mapDbToEvent(data));
          }
        } catch {}
        setIsFetchingDirect(false);
      })();
    }
  }, [cleanSlug, events]);

  // Live capacity tracking directly from Supabase
  useEffect(() => {
    if (!event?.id) return;
    (async () => {
      try {
        const { count, error } = await supabase
          .from('attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .neq('status', 'cancelled');
        if (!error && count !== null) {
          setLiveRegCount(count);
        }
      } catch {}
    })();
  }, [event?.id]);

  // Update default city when event loads
  useEffect(() => {
    if (event?.city) {
      setFormData((prev) => ({
        ...prev,
        f_city: prev.f_city || event.city,
      }));
    }
  }, [event?.city]);

  // Computed values
  const totalRegs = liveRegCount !== null ? liveRegCount : (event?.stats?.totalRegistrations ?? 0);
  const maxCapacity = event?.settings?.capacity ?? 0;
  const isCapacityUnlimited = maxCapacity <= 0;
  const isSoldOut = !isCapacityUnlimited && totalRegs >= maxCapacity;
  const remaining = isCapacityUnlimited ? 999999 : Math.max(0, maxCapacity - totalRegs);
  const capacityPct = isCapacityUnlimited || maxCapacity <= 0 ? 0 : Math.min(100, Math.round((totalRegs / maxCapacity) * 100));

  // If data is still loading from Supabase, show a warm loading placeholder
  if (isFetchingDirect || (!event && appLoading)) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-sm w-full flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#C49A3C]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Loading Event Details...</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">Connecting to live registration portal</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show not found if loading has fully completed and no event exists
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#F5F3EE]">
        <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-md w-full">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Event Not Found</h2>
          <p className="text-sm text-[#6B6B6B] mt-2">
            The requested event page could not be located or has expired.
          </p>
          <Button className="mt-5 rounded-xl" onClick={() => navigateTo('/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSoldOut) {
      addToast({
        type: 'error',
        title: 'Event Sold Out',
        description: `This event has reached its maximum capacity limit of ${maxCapacity} attendee(s).`,
      });
      return;
    }

    // Validate required file fields
    for (const f of event.fields || []) {
      if (f.required && f.type === 'file' && !formData[f.id]) {
        addToast({
          type: 'warning',
          title: 'File Required',
          description: `Please upload a file for "${f.label}".`,
        });
        return;
      }
    }

    // Check if any file upload is currently in progress
    const isAnyUploading = Object.values(fileUploadState).some((s) => s.isUploading);
    if (isAnyUploading) {
      addToast({
        type: 'info',
        title: 'Upload in Progress',
        description: 'Please wait for your file to finish uploading before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find any uploaded image to assign as avatarUrl if present
      const fileField = (event.fields || []).find((f) => f.type === 'file' && formData[f.id]);
      const uploadedFileUrl = fileField ? formData[fileField.id] : undefined;

      const newAttendee = await registerAttendee(
        event.id,
        {
          fullName: formData.f_name || 'Registered Delegate',
          email: formData.f_email || 'delegate@example.com',
          phone: formData.f_phone || '+91 98000 00000',
          company: formData.f_company || 'Independent',
          jobTitle: formData.f_designation || 'Attendee',
          city: formData.f_city || event.city,
          ticketType: formData.f_delegatetype || 'General Attendee',
          avatarUrl: uploadedFileUrl || formData.avatarUrl,
          customAnswers: formData,
        },
        event
      );

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
    } catch (err: any) {
      console.error('Registration failed:', err);
      setIsSubmitting(false);
      // Refresh live count from DB
      if (event?.id) {
        supabase
          .from('attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .neq('status', 'cancelled')
          .then(({ count }) => {
            if (count !== null) setLiveRegCount(count);
          });
      }
      addToast({
        type: 'error',
        title: 'Registration Unsuccessful',
        description: err?.message || 'Could not complete registration.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] text-[#1A1A1A] pb-16">
      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E8E5DF]/70 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
            style={{ backgroundColor: event.branding?.primaryColor || '#1A1A1A' }}
          >
            EF
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[#1A1A1A]">
            {event.organizationName || 'EventFlow'}
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E8E5DF] text-xs font-medium text-[#6B6B6B] hover:bg-[#FAFAF7] transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Event Hero & Info (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Event Cover Image */}
            {event.branding?.coverImageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-md border border-[#E8E5DF]/70 aspect-video relative bg-[#1A1A1A]">
                <img
                  src={event.branding.coverImageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-[#1A1A1A] shadow-xs backdrop-blur-xs">
                    {event.category}
                  </span>
                </div>
              </div>
            )}

            {/* Event Title & Metadata Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight leading-snug">
                {event.name}
              </h1>

              <p className="text-sm text-[#6B6B6B] leading-relaxed">{event.description}</p>

              {/* Date & Location Highlights */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#F0EDE8]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#8B6914] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">{formatDate(event.date)}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{event.startTime} - {event.endTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">{event.venueName}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{event.venueAddress || event.city}</p>
                  </div>
                </div>
              </div>

              {/* Event Tags */}
              {event.settings?.tags && event.settings.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-[#F0EDE8]">
                  {event.settings.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-[#FAFAF7] border border-[#E8E5DF] text-[#6B6B6B] text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer Info Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Organized By</p>
                <h4 className="text-sm font-bold text-[#1A1A1A] mt-0.5">{event.organizerName || 'Event Host'}</h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">{event.organizerEmail} • {event.organizerContact}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0EDE8] flex items-center justify-center text-[#1A1A1A] font-bold text-sm">
                {(event.organizerName || 'E').charAt(0)}
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sticky top-24 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EDE8]">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A]">Delegate Registration</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Instant QR badge generation</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Free Entry
                </span>
              </div>

              {/* Live Capacity Meter */}
              <div className="my-2 p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8] text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-[#1A1A1A]">
                  <span>Registration Status</span>
                  {isSoldOut ? (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      Sold Out (100%)
                    </span>
                  ) : (
                    <span className="text-[#C49A3C]">{capacityPct}% Full</span>
                  )}
                </div>
                <Progress value={capacityPct} />
                <p className="text-[11px] text-[#6B6B6B] pt-0.5">
                  {isSoldOut
                    ? `Capacity of ${maxCapacity.toLocaleString()} seat(s) has been completely filled.`
                    : `${remaining} seat${remaining !== 1 ? 's' : ''} remaining of ${
                        maxCapacity > 0 ? maxCapacity.toLocaleString() : 'unlimited'
                      } capacity limit.`}
                </p>
              </div>

              {/* Capacity Limit Alert Banner */}
              {isSoldOut && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className="text-base">🚫</span>
                    <span>Registration Closed &bull; Capacity Reached</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This event has reached its maximum capacity of {maxCapacity} attendee{maxCapacity > 1 ? 's' : ''}. All seats are booked and no further registrations can be accepted.
                  </p>
                </div>
              )}

              {/* Dynamic Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {(event.fields || []).map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id} className="text-xs font-semibold text-[#1A1A1A]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>

                    {field.type === 'file' ? (
                      <div className="space-y-1.5">
                        {fileUploadState[field.id]?.previewUrl || formData[field.id] ? (
                          <div className="p-3 bg-[#FAFAF7] border border-[#E8E5DF] rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {fileUploadState[field.id]?.previewUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
                              formData[field.id]?.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
                              fileUploadState[field.id]?.previewUrl?.startsWith('blob:') ||
                              fileUploadState[field.id]?.previewUrl?.startsWith('data:') ? (
                                <img
                                  src={fileUploadState[field.id]?.previewUrl || formData[field.id]}
                                  alt="Upload Preview"
                                  className="w-12 h-12 object-cover rounded-xl border border-[#E8E5DF] shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="truncate">
                                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                                  {fileUploadState[field.id]?.fileName || 'Uploaded File'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                                  <Check className="w-3 h-3" /> Ready to submit
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleClearFile(field.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`upload_${field.id}`}
                            className={`border-2 border-dashed border-[#E8E5DF] hover:border-[#C49A3C] bg-[#FAFAF7] hover:bg-amber-50/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group text-center ${
                              fileUploadState[field.id]?.isUploading ? 'pointer-events-none opacity-60' : ''
                            }`}
                          >
                            <input
                              id={`upload_${field.id}`}
                              type="file"
                              accept="image/*,application/pdf"
                              disabled={isSoldOut || isSubmitting || fileUploadState[field.id]?.isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(field.id, file);
                              }}
                              className="hidden"
                            />
                            {fileUploadState[field.id]?.isUploading ? (
                              <div className="flex flex-col items-center gap-2 py-1">
                                <Loader2 className="w-6 h-6 animate-spin text-[#C49A3C]" />
                                <span className="text-xs font-semibold text-[#1A1A1A]">
                                  Uploading to secure cloud...
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#E8E5DF] flex items-center justify-center text-[#9A9A9A] group-hover:text-[#C49A3C] group-hover:scale-110 transition-all">
                                  <UploadCloud className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-xs text-[#1A1A1A]">
                                    <span className="font-bold underline decoration-[#C49A3C] underline-offset-2">
                                      Click to upload
                                    </span>{' '}
                                    or drag & drop
                                  </p>
                                  <p className="text-[10px] text-[#9A9A9A]">
                                    {field.placeholder || 'Image (JPG, PNG, WEBP) or PDF up to 10MB'}
                                  </p>
                                </div>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        id={field.id}
                        disabled={isSoldOut || isSubmitting}
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${(field.label || '').toLowerCase()}...`}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        rows={3}
                        className="w-full p-2.5 rounded-xl border border-[#E8E5DF] text-xs focus:ring-2 focus:ring-[#C49A3C] outline-none disabled:opacity-50"
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs text-[#3A3A3A] cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          id={field.id}
                          disabled={isSoldOut || isSubmitting}
                          checked={formData[field.id] === 'true' || formData[field.id] === 'yes'}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.id]: e.target.checked ? 'yes' : 'no' })
                          }
                          className="rounded text-[#1A1A1A] focus:ring-[#C49A3C]"
                        />
                        <span>{field.placeholder || field.label}</span>
                      </label>
                    ) : field.type === 'date' ? (
                      <Input
                        disabled={isSoldOut || isSubmitting}
                        id={field.id}
                        type="date"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        className="h-10 rounded-xl disabled:opacity-50"
                      />
                    ) : field.type === 'dropdown' ? (
                      <Select
                        disabled={isSoldOut || isSubmitting}
                        value={formData[field.id] || ''}
                        onValueChange={(val) => setFormData({ ...formData, [field.id]: val })}
                      >
                        <SelectTrigger id={field.id} className="h-10 rounded-xl disabled:opacity-50">
                          <SelectValue placeholder="Select option..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-1.5 mt-1">
                        {field.options?.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 text-xs text-[#3A3A3A] cursor-pointer">
                            <input
                              disabled={isSoldOut || isSubmitting}
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={formData[field.id] === opt}
                              onChange={(e) =>
                                setFormData({ ...formData, [field.id]: e.target.value })
                              }
                              className="text-[#1A1A1A] focus:ring-[#C49A3C] disabled:opacity-50"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <Input
                        disabled={isSoldOut || isSubmitting}
                        id={field.id}
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        required={field.required}
                        placeholder={field.placeholder || `Enter ${(field.label || '').toLowerCase()}`}
                        value={formData[field.id] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.id]: e.target.value })
                        }
                        className="h-10 rounded-xl disabled:opacity-50"
                      />
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isSoldOut}
                    className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : isSoldOut ? (
                      <span>Registration Closed (Capacity Reached)</span>
                    ) : (
                      <>
                        <span>Confirm Registration & Get QR Pass</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-[#6B6B6B] pt-2 text-center">
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
