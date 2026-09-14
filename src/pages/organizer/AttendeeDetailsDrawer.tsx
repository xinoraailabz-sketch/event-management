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
  Eye,
  Download,
  FileText,
  X,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

interface AttendeeDetailsDrawerProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
}

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch {
    // Fallback direct open
    window.open(url, '_blank');
  }
}

export const AttendeeDetailsDrawer: React.FC<AttendeeDetailsDrawerProps> = ({
  attendee,
  isOpen,
  onClose,
}) => {
  const { activeEvent, checkInAttendee, undoCheckIn, navigateTo, addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string } | null>(null);

  if (!attendee || !activeEvent) return null;

  // Extract all file / image attachments
  const attachments: { key: string; label: string; url: string; isImage: boolean }[] = [];

  if (attendee.avatarUrl && (attendee.avatarUrl.startsWith('http') || attendee.avatarUrl.startsWith('data:'))) {
    attachments.push({
      key: 'avatar',
      label: 'Profile / Badge Photo',
      url: attendee.avatarUrl,
      isImage: true,
    });
  }

  if (attendee.customAnswers) {
    Object.entries(attendee.customAnswers).forEach(([key, val]) => {
      if (
        typeof val === 'string' &&
        (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image'))
      ) {
        if (!attachments.some((a) => a.url === val)) {
          const matchedField = activeEvent?.fields?.find((f) => f.id === key);
          const isImg =
            val.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) != null ||
            val.includes('/image/') ||
            val.startsWith('data:image');
          attachments.push({
            key,
            label: matchedField?.label || 'Uploaded File',
            url: val,
            isImage: isImg,
          });
        }
      }
    });
  }

  // Extract custom textual answers
  const customTextEntries: { label: string; value: string }[] = [];
  if (attendee.customAnswers) {
    Object.entries(attendee.customAnswers).forEach(([key, val]) => {
      if (
        key !== 'f_name' &&
        key !== 'f_email' &&
        key !== 'f_phone' &&
        key !== 'f_company' &&
        key !== 'f_designation' &&
        key !== 'f_city' &&
        key !== 'f_delegatetype' &&
        key !== 'avatarUrl' &&
        typeof val === 'string' &&
        !val.startsWith('http://') &&
        !val.startsWith('https://') &&
        !val.startsWith('data:') &&
        val.trim() !== ''
      ) {
        const matchedField = activeEvent?.fields?.find((f) => f.id === key);
        customTextEntries.push({
          label: matchedField?.label || key.replace(/^f_/, '').replace(/_/g, ' '),
          value: val,
        });
      }
    });
  }

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
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="Attendee Pass & Profile" maxWidth="lg">
        <div className="space-y-6">
          {/* Header Profile Info */}
          <div className="flex items-start justify-between bg-[#FAFAF7] p-4 rounded-2xl border border-[#E8E5DF]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] text-[#F5EDD8] font-bold flex items-center justify-center text-base shadow-xs overflow-hidden border border-[#E8E5DF]">
                {attendee.avatarUrl ? (
                  <img
                    src={attendee.avatarUrl}
                    alt={attendee.fullName}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      setPreviewMedia({
                        url: attendee.avatarUrl!,
                        title: `${attendee.fullName} - Photo`,
                      })
                    }
                    title="Click to view full photo"
                  />
                ) : (
                  attendee.fullName.charAt(0).toUpperCase()
                )}
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
              leftIcon={
                isSendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-[#C49A3C]" />
                )
              }
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

          {/* Uploaded Documents & Media */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
                  Uploaded Documents & Images ({attachments.length})
                </h4>
              </div>

              <div className="space-y-3">
                {attachments.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {item.isImage ? (
                        <div
                          onClick={() =>
                            setPreviewMedia({
                              url: item.url,
                              title: `${attendee.fullName} - ${item.label}`,
                            })
                          }
                          className="w-16 h-16 rounded-xl overflow-hidden border border-[#E8E5DF] bg-white shrink-0 cursor-pointer group relative shadow-2xs"
                        >
                          <img
                            src={item.url}
                            alt={item.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}

                      <div className="truncate">
                        <p className="text-xs font-bold text-[#1A1A1A]">{item.label}</p>
                        <p className="text-[11px] text-[#6B6B6B] truncate max-w-xs mt-0.5 font-mono">
                          {item.url}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold mt-1">
                          Cloudinary Secure
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (item.isImage) {
                            setPreviewMedia({
                              url: item.url,
                              title: `${attendee.fullName} - ${item.label}`,
                            });
                          } else {
                            window.open(item.url, '_blank');
                          }
                        }}
                        className="flex-1 sm:flex-initial text-xs py-1.5 px-3 rounded-xl border-[#E8E5DF] hover:bg-white"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          downloadFile(
                            item.url,
                            `${attendee.registrationId}_${item.key}.${item.isImage ? 'jpg' : 'pdf'}`
                          )
                        }
                        className="flex-1 sm:flex-initial text-xs py-1.5 px-3 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Form Answers */}
          {customTextEntries.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A9A9A]">
                Registration Form Details
              </h4>
              <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] space-y-2 text-xs">
                {customTextEntries.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-[#F0EDE8] last:border-b-0">
                    <span className="text-[#6B6B6B] font-medium">{entry.label}:</span>
                    <span className="font-semibold text-[#1A1A1A]">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Lightbox / High-Resolution Image Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#E8E5DF] flex items-center justify-between bg-[#FAFAF7]">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">{previewMedia.title}</h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  {attendee.fullName} &bull; {attendee.registrationId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadFile(
                      previewMedia.url,
                      `${attendee.registrationId}-document.jpg`
                    )
                  }
                  className="rounded-xl text-xs py-1 px-3"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </Button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-black/5 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-[#1A1A1A] overflow-auto flex-1 min-h-[300px]">
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

