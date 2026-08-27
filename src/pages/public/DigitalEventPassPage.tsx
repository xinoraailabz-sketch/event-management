import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  MapPin,
  QrCode,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Building,
  User,
  ArrowLeft,
  Sparkles,
  Ticket,
  Copy,
  Check,
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
  const { events, attendees, navigateTo, activeEvent: defaultEvent, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const event = events.find((e) => e.slug === eventSlug) || defaultEvent || events[0];
  const attendee = attendees.find((a) => a.id === attendeeId) || attendees[0];

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

  if (!attendee || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pass Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">The attendee pass requested does not exist.</p>
          <Button className="mt-4" onClick={() => navigateTo('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 py-8 px-4 sm:px-6 flex flex-col items-center justify-center selection:bg-indigo-600 selection:text-white">
      {/* Action Bar (Top) */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigateTo(`/e/${event.slug}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
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
          >
            Share
          </Button>
        </div>
      </div>

      {/* Real Digital Pass Card */}
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden print:shadow-none print:border-slate-400">
        {/* Pass Header Banner */}
        <div
          className="p-6 text-white relative"
          style={{ backgroundColor: event.branding.primaryColor || '#4f46e5' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs">
                EF
              </div>
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
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
          <p className="text-xs opacity-80 mt-1">{event.category} • {event.city}</p>
        </div>

        {/* Pass Body Info */}
        <div className="p-6 space-y-5">
          {/* Attendee Name & Designation */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Delegate Name
              </p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{attendee.fullName}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {attendee.jobTitle ? `${attendee.jobTitle}, ` : ''}{attendee.company || 'Individual Delegate'}
              </p>
            </div>

            <div className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tier</p>
              <p className="text-xs font-bold text-indigo-700">{attendee.ticketType || 'General'}</p>
            </div>
          </div>

          {/* Registration ID & Pass Details */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Registration ID</p>
              <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-slate-900">
                <span>{attendee.registrationId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Entry Access</p>
              <p className="font-bold text-slate-900 mt-0.5">Universal (Any Desk / Staff)</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Date & Time</p>
              <p className="font-medium text-slate-800 mt-0.5">{formatDate(event.date)}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">City</p>
              <p className="font-medium text-slate-800 mt-0.5">{event.city}</p>
            </div>
          </div>

          {/* Large High-Res QR Code */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <QRCodeDisplay
              value={attendee.qrToken || attendee.registrationId}
              size={190}
              primaryColor={event.branding.primaryColor || '#0f172a'}
            />
            <p className="text-xs font-semibold text-slate-700 mt-3 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              Show this QR code at entrance for instant scanning
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">High-speed verification enabled</p>
          </div>

          {/* Venue & Organizer Details */}
          <div className="pt-4 border-t border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{event.venueName}, {event.venueAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Gates Open at 08:30 AM • Entry closes at 11:00 AM</span>
            </div>
          </div>
        </div>

        {/* Pass Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Organized by {event.organizerName}</span>
          <span className="font-mono">Powered by EventFlow</span>
        </div>
      </div>

      {/* Switch to organizer demo prompt */}
      <div className="mt-6 text-center print:hidden">
        <button
          onClick={() => navigateTo(`/app/events/${event.id}/check-in`)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
        >
          <span>Switch to Staff Scanner View to scan this pass →</span>
        </button>
      </div>
    </div>
  );
};
