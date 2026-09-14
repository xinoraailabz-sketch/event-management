import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Attendee } from '../../types';
import { Drawer } from '../../components/common/Drawer';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { QRCodeDisplay } from '../../components/common/QRCodeDisplay';
import { sendRegistrationConfirmation } from '../../lib/maileroo';
import {
  Mail,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Send,
  Loader2,
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!attendee || !activeEvent) return null;

  const handleCopyPassLink = () => {
    const url = `${window.location.origin}/e/${activeEvent.slug}/pass/${attendee.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast({ type: 'success', title: 'Pass Link Copied', description: 'Digital pass URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCheckIn = async () => {
    if (attendee.status === 'checked_in') {
      await undoCheckIn(attendee.id);
    } else {
      await checkInAttendee(attendee.id, 'Universal Desk', 'Admin Operator');
    }
  };

  const handleSendEmailTicket = async () => {
    setIsSendingEmail(true);
    try {
      const res = await sendRegistrationConfirmation(attendee, activeEvent);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'QR Pass Emailed',
          description: `Ticket and QR code sent to ${attendee.email}. Advise checking Spam folder if not in Inbox.`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Delivery Notice',
          description: res.message || 'Could not send email.',
        });
      }
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to send QR confirmation email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Attendee Pass & Profile" maxWidth="lg">
      <div className="space-y-6">
        {/* Header Profile Info */}
        <div className="flex items-start justify-between bg-[#FAFAF7] p-4 rounded-2xl border border-[#E8E5DF]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] text-[#F5EDD8] font-bold flex items-center justify-center text-base shadow-xs">
              {attendee.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">{attendee.fullName}</h3>
              <p className="text-xs text-[#6B6B6B]">
                {attendee.jobTitle ? `${attendee.jobTitle} • ` : ''}{attendee.company || 'Independent'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono text-[11px] font-bold text-[#1A1A1A] bg-white px-2 py-0.5 rounded-md border border-[#E8E5DF]">
                  {attendee.registrationId}
                </span>
                <Badge status={attendee.status} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-2.5">
          {attendee.status === 'checked_in' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleCheckIn}
              className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Undo Check-in
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleToggleCheckIn}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Mark Checked In
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={isSendingEmail}
            onClick={handleSendEmailTicket}
            className="rounded-xl border-[#E8E5DF] text-[#1A1A1A] hover:bg-[#FAFAF7]"
            leftIcon={isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#C49A3C]" />}
          >
            {isSendingEmail ? 'Sending...' : 'Email QR Ticket'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPassLink}
            className="rounded-xl"
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied' : 'Copy Pass URL'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo(`/e/${activeEvent.slug}/pass/${attendee.id}`)}
            className="rounded-xl"
            leftIcon={<ExternalLink className="w-4 h-4" />}
          >
            Open Live Pass
          </Button>
        </div>

        {/* Digital QR Pass Preview */}
        <div className="bg-[#1A1A1A] text-white p-5 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#F5EDD8]">
              Live QR Ticket Pass
            </span>
            <span className="text-xs text-[#C49A3C] font-mono">Token: {attendee.qrToken.substring(0, 12)}...</span>
          </div>

          <div className="flex items-center justify-center p-3.5 bg-white rounded-2xl">
            <QRCodeDisplay
              value={attendee.qrToken}
              size={150}
              primaryColor="#1A1A1A"
            />
          </div>

          <p className="text-[11px] text-center text-white/70">
            Show this QR code to any event staff or scanner desk for instant verification.
          </p>
        </div>

        {/* Contact Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Contact Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#9A9A9A] shrink-0" />
              <span className="truncate text-[#1A1A1A] font-medium">{attendee.email}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#9A9A9A] shrink-0" />
              <span className="truncate text-[#1A1A1A] font-medium">{attendee.phone}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center gap-2.5">
              <Building className="w-4 h-4 text-[#9A9A9A] shrink-0" />
              <span className="truncate text-[#1A1A1A] font-medium">{attendee.company || 'Not Specified'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#9A9A9A] shrink-0" />
              <span className="truncate text-[#1A1A1A] font-medium">{attendee.city || 'India'}</span>
            </div>
          </div>
        </div>

        {/* Check-In Audit Trail */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">Attendance Audit Trail</h4>
          <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Registered At:</span>
              <span className="font-medium text-[#1A1A1A]">{formatDateTime(attendee.registeredAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Check-in Status:</span>
              <span className={`font-bold ${attendee.status === 'checked_in' ? 'text-emerald-600' : 'text-[#6B6B6B]'}`}>
                {attendee.status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {attendee.checkedInAt && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Checked-in At:</span>
                  <span className="font-medium text-[#1A1A1A]">{formatDateTime(attendee.checkedInAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Scanner Desk:</span>
                  <span className="font-medium text-[#1A1A1A]">{attendee.checkedInBy || 'Universal Desk'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
