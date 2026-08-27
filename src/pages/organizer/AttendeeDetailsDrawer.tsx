import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Attendee } from '../../types';
import { Drawer } from '../../components/common/Drawer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { QRCodeDisplay } from '../../components/common/QRCodeDisplay';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Printer,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

interface AttendeeDetailsDrawerProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendeeDetailsDrawer: React.FC<AttendeeDetailsDrawerProps> = ({
  attendee,
  isOpen,
  onClose,
}) => {
  const { activeEvent, checkInAttendee, undoCheckIn, navigateTo, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!attendee || !activeEvent) return null;

  const handleCopyPassLink = () => {
    const url = `${window.location.origin}/e/${activeEvent.slug}/pass/${attendee.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast({ type: 'success', title: 'Pass Link Copied', description: 'Digital pass URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCheckIn = () => {
    if (attendee.status === 'checked_in') {
      undoCheckIn(attendee.id);
      addToast({ type: 'info', title: 'Check-in Reverted', description: `${attendee.fullName} is now unchecked.` });
    } else {
      checkInAttendee(attendee.id, 'Entrance A', 'Admin Operator');
      addToast({ type: 'success', title: 'Checked In', description: `${attendee.fullName} marked as checked in.` });
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Attendee Pass & Profile" maxWidth="lg">
      <div className="space-y-6">
        {/* Header Profile Info */}
        <div className="flex items-start justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
              {attendee.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{attendee.fullName}</h3>
              <p className="text-xs text-slate-500">
                {attendee.jobTitle ? `${attendee.jobTitle} • ` : ''}{attendee.company || 'Independent'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {attendee.registrationId}
                </span>
                <Badge status={attendee.status} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Check-in Action Bar */}
        <div className="flex items-center gap-3">
          {attendee.status === 'checked_in' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleCheckIn}
              className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Undo Check-in
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleToggleCheckIn}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Mark Checked In
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPassLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied' : 'Copy Pass URL'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(`/e/${activeEvent.slug}/pass/${attendee.id}`)}
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Open Pass
          </Button>
        </div>

        {/* Digital QR Pass Preview */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Live QR Ticket Pass
            </span>
            <span className="text-xs text-indigo-400 font-mono">Token: {attendee.qrToken.substring(0, 12)}...</span>
          </div>

          <div className="flex items-center justify-center p-3 bg-white rounded-xl">
            <QRCodeDisplay
              value={attendee.qrToken}
              size={140}
              primaryColor="#0f172a"
            />
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Show this QR code to any event staff or scanner desk for admission.
          </p>
        </div>

        {/* Contact & Registration Metadata */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate text-slate-800 font-medium">{attendee.email}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate text-slate-800 font-medium">{attendee.phone}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate text-slate-800 font-medium">{attendee.company || 'Not Specified'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate text-slate-800 font-medium">{attendee.city || 'India'}</span>
            </div>
          </div>
        </div>

        {/* Check-In Audit Trail */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Audit Trail</h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Registered At:</span>
              <span className="font-medium text-slate-800">{formatDateTime(attendee.registeredAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Check-in Status:</span>
              <span className={`font-bold ${attendee.status === 'checked_in' ? 'text-emerald-600' : 'text-slate-500'}`}>
                {attendee.status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {attendee.checkedInAt && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Checked-in At:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(attendee.checkedInAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scanner Staff:</span>
                  <span className="font-medium text-slate-800">{attendee.checkedInBy || 'Rahul Sundar'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
