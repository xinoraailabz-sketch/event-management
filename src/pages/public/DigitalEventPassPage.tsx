import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { mapDbToEvent, mapDbToAttendee } from '../../lib/db-mappers';
import { sendRegistrationConfirmation } from '../../lib/maileroo';
import { EventItem, Attendee } from '../../types';
import {
  Calendar,
  MapPin,
  QrCode,
  Printer,
  Share2,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { QRCodeDisplay } from '../../components/common/QRCodeDisplay';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/common/Badge';

interface DigitalEventPassPageProps {
  eventSlug?: string;
  attendeeId?: string;
}

export const DigitalEventPassPage: React.FC<DigitalEventPassPageProps> = ({ eventSlug, attendeeId }) => {
  const { events, attendees, navigateTo, activeEvent: defaultEvent, addToast, isLoading: appLoading } = useApp();
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [directEvent, setDirectEvent] = useState<EventItem | null>(null);
  const [directAttendee, setDirectAttendee] = useState<Attendee | null>(null);
  const [isDirectLoading, setIsDirectLoading] = useState(false);

  const cleanSlug = React.useMemo(() => {
    if (!eventSlug) return '';
    return eventSlug.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
  }, [eventSlug]);

  const cleanAttendeeId = React.useMemo(() => {
    if (!attendeeId) return '';
    return attendeeId.split('?')[0].split('#')[0].replace(/\/+$/, '').trim();
  }, [attendeeId]);

  const event =
    events.find((e) => e.slug === cleanSlug) ||
    directEvent ||
    (defaultEvent?.slug === cleanSlug ? defaultEvent : null);

  const attendee =
    attendees.find((a) => a.id === cleanAttendeeId || a.registrationId === cleanAttendeeId) ||
    directAttendee;

  // Direct fetch fallback from Supabase if page is loaded directly in browser
  useEffect(() => {
    if ((!event || !attendee) && (cleanSlug || cleanAttendeeId)) {
      setIsDirectLoading(true);
      Promise.all([
        cleanSlug
          ? supabase.from('events').select('*').eq('slug', cleanSlug).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        cleanAttendeeId
          ? supabase.from('attendees').select('*').or(`id.eq.${cleanAttendeeId},registration_id.eq.${cleanAttendeeId}`).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])
        .then(([evtRes, attRes]) => {
          if (evtRes.data) setDirectEvent(mapDbToEvent(evtRes.data));
          if (attRes.data) setDirectAttendee(mapDbToAttendee(attRes.data));
          setIsDirectLoading(false);
        })
        .catch(() => {
          setIsDirectLoading(false);
        });
    }
  }, [cleanSlug, cleanAttendeeId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    if (!attendee) return;
    navigator.clipboard.writeText(attendee.registrationId);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Registration ID Copied',
      description: `Copied ${attendee.registrationId} to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResendEmail = async () => {
    if (!attendee || !event) return;
    setIsResending(true);
    try {
      const res = await sendRegistrationConfirmation(attendee, event);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Pass Emailed',
          description: `QR Ticket sent to ${attendee.email}. Please check Inbox or Spam folder.`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Delivery Notice',
          description: res.message || 'Could not send email. Please verify API key.',
        });
      }
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to send confirmation email.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Loading state (prevents flash of 404)
  if (appLoading || isDirectLoading || ((!event || !attendee) && (appLoading || isDirectLoading))) {
    return (
      <div className="min-h-screen bg-[#F5F3EE] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-sm w-full flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#C49A3C]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Generating Digital Pass...</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">Retrieving verified delegate credentials</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show not found if fully finished loading
  if (!attendee || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#F5F3EE]">
        <div className="p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-md w-full">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Pass Not Found</h2>
          <p className="text-sm text-[#6B6B6B] mt-2">The attendee pass requested does not exist or was cancelled.</p>
          <Button className="mt-5 rounded-xl" onClick={() => navigateTo('/login')}>Return to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] py-8 px-4 sm:px-6 flex flex-col items-center justify-center selection:bg-amber-200 selection:text-amber-950">
      {/* Action Bar (Top) */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigateTo(`/e/${event.slug}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />} className="rounded-xl">
            Print Pass
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${event.name} Pass`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                addToast({
                  type: 'success',
                  title: 'Pass Link Copied',
                  description: 'Pass URL copied to clipboard.',
                });
              }
            }}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            className="rounded-xl"
          >
            Share
          </Button>
        </div>
      </div>

      {/* Spam Folder Alert & Email Status Banner */}
      <div className="max-w-md w-full mb-4 p-4 rounded-3xl bg-[#FFF9EE] border border-[#EEDDC0] text-xs space-y-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:hidden">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#8B6914] flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#C49A3C]" />
            Ticket Sent to {attendee.email}
          </span>
          <button
            type="button"
            disabled={isResending}
            onClick={handleResendEmail}
            className="text-[11px] font-bold text-[#8B6914] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            <span>Resend Email</span>
          </button>
        </div>
        <p className="text-[#6B5820] text-[11px] leading-relaxed">
          💡 If you don't see the confirmation in your Inbox, please check your <strong>Spam / Junk / Promotions</strong> folder and mark it as <em>"Not Spam"</em>.
        </p>
      </div>

      {/* Real Digital Pass Card */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E5DF]/70 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden print:shadow-none print:border-slate-400">
        {/* Pass Header Banner */}
        <div
          className="p-6 text-white relative bg-[#1A1A1A]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C49A3C] flex items-center justify-center font-bold text-xs text-white">
                EF
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5EDD8]">
                Official Delegate Pass
              </span>
            </div>
            <Badge
              status={attendee.status}
              size="sm"
              className="bg-white/20 text-white border-white/30 text-[10px]"
            />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight leading-snug">{event.name}</h2>
          <p className="text-xs text-white/70 mt-1">{event.category} • {event.city}</p>
        </div>

        {/* Pass Body Info */}
        <div className="p-6 space-y-5">
          {/* Attendee Name & Designation */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-wider">
                Delegate Name
              </p>
              <h3 className="text-xl font-bold text-[#1A1A1A] mt-0.5">{attendee.fullName}</h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {attendee.jobTitle ? `${attendee.jobTitle}, ` : ''}{attendee.company || 'Individual Delegate'}
              </p>
            </div>

            <div className="px-3 py-1 rounded-xl bg-[#FAFAF7] border border-[#E8E5DF] text-right">
              <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase">Tier</p>
              <p className="text-xs font-bold text-[#8B6914]">{attendee.ticketType || 'General'}</p>
            </div>
          </div>

          {/* Registration ID & Pass Details */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8] text-xs">
            <div>
              <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase">Registration ID</p>
              <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-[#1A1A1A]">
                <span>{attendee.registrationId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase">Entry Access</p>
              <p className="font-bold text-[#1A1A1A] mt-0.5">Universal (Any Desk / Staff)</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase">Date & Time</p>
              <p className="font-medium text-[#1A1A1A] mt-0.5">{formatDate(event.date)}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#9A9A9A] uppercase">City</p>
              <p className="font-medium text-[#1A1A1A] mt-0.5">{event.city}</p>
            </div>
          </div>

          {/* Large High-Res QR Code */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <QRCodeDisplay
              value={attendee.qrToken || attendee.registrationId}
              size={190}
              primaryColor="#1A1A1A"
            />
            <p className="text-xs font-semibold text-[#1A1A1A] mt-3 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#C49A3C]" />
              Show this QR code at entrance for instant scanning
            </p>
            <p className="text-[11px] text-[#9A9A9A] mt-0.5">High-speed verification enabled</p>
          </div>

          {/* Venue & Organizer Details */}
          <div className="pt-4 border-t border-dashed border-[#E8E5DF] text-xs text-[#6B6B6B] space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0 mt-0.5" />
              <span>{event.venueName}, {event.venueAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />
              <span>Gates Open at 08:30 AM • Entry closes at 11:00 AM</span>
            </div>
          </div>
        </div>

        {/* Pass Footer */}
        <div className="px-6 py-3 bg-[#FAFAF7] border-t border-[#F0EDE8] flex items-center justify-between text-[11px] text-[#9A9A9A]">
          <span>Organized by {event.organizerName || 'Event Host'}</span>
          <span className="font-mono">Powered by EventFlow</span>
        </div>
      </div>

    </div>
  );
};
