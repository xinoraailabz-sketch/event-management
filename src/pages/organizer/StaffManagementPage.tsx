import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  Plus,
  ShieldCheck,
  Smartphone,
  Wifi,
  QrCode,
  Trash2,
  Mail,
  User,
  Phone,
  Copy,
  Check,
  Calendar,
  Globe,
  Send,
} from 'lucide-react';
import { sendStaffInviteEmail } from '@/lib/maileroo';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StaffMember } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export const StaffManagementPage: React.FC = () => {
  const {
    activeEvent,
    events,
    staff,
    staffList,
    updateStaff,
    addStaffMember,
    deleteStaff,
    navigateTo,
    addToast,
  } = useApp();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaffQR, setSelectedStaffQR] = useState<StaffMember | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'staff' | 'admin'>('staff');
  const [formEventScope, setFormEventScope] = useState<'all' | 'specific'>('all');
  const [formSelectedEventIds, setFormSelectedEventIds] = useState<string[]>([]);

  const allStaff = (staff && staff.length > 0 ? staff : staffList) || [];

  const handleRoleChange = async (member: StaffMember, newRole: 'admin' | 'staff') => {
    await updateStaff(member.id, { role: newRole });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    const assignedEventVal =
      formEventScope === 'all' || formSelectedEventIds.length === 0
        ? 'all'
        : formSelectedEventIds.join(',');

    await addStaffMember({
      name: formName,
      email: formEmail,
      phone: formPhone || '+91 98000 00000',
      role: formRole,
      assignedGate: 'Any Location',
      assignedEntrance: 'Any Location',
      assignedEventId: assignedEventVal,
      status: 'active',
      checkInCount: 0,
    });

    setIsInviteModalOpen(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('staff');
    setFormEventScope('all');
    setFormSelectedEventIds([]);
  };

  const handleCopyLink = (member: StaffMember) => {
    const link = `${window.location.origin}/login`;
    navigator.clipboard.writeText(link);
    setCopiedId(member.id);
    addToast({
      type: 'success',
      title: 'Login Link Copied',
      description: `Staff portal sign-in link copied to clipboard.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResendCredentials = async (member: StaffMember) => {
    setResendingId(member.id);
    const targetEv =
      events.find((e) => e.id === member.assignedEventId) ||
      activeEvent ||
      events[0] ||
      ({
        id: 'universal',
        name: 'All Events (Universal)',
        city: 'Event Venue',
        slug: 'staff-portal',
      } as any);

    try {
      const res = await sendStaffInviteEmail(member, targetEv, member.loginToken);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Credentials Emailed',
          description: `Login email and password resent to ${member.email}`,
          duration: 5000,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Email Notice',
          description: res.message,
          duration: 6000,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Send Error',
        description: err.message || 'Failed to resend credentials.',
      });
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Check-In Staff"
        subtitle={
          activeEvent
            ? `Equip and manage check-in staff to scan delegates across ${activeEvent.name}`
            : 'Equip and manage check-in staff to scan delegates across assigned events'
        }
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          ...(activeEvent
            ? [{ label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) }]
            : []),
          { label: 'Staff Management' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (activeEvent) {
                setFormEventScope('specific');
                setFormSelectedEventIds([activeEvent.id]);
              } else {
                setFormEventScope('all');
                setFormSelectedEventIds([]);
              }
              setIsInviteModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white"
          >
            Invite Scanner Staff
          </Button>
        }
      />

      {/* Staff Grid Cards or Empty State */}
      {allStaff.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-[#9A9A9A]" />}
          title="No Scanner Staff Members Yet"
          description="Invite staff operators and assign them to specific events or all events so they can log in and verify delegates seamlessly."
          primaryAction={{
            label: 'Invite Scanner Staff',
            onClick: () => setIsInviteModalOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allStaff.map((member) => {
            const isAllEvents = !member.assignedEventId || member.assignedEventId === 'all';
            const assignedIds = member.assignedEventId ? member.assignedEventId.split(',').map((s) => s.trim()) : [];

            return (
              <div
                key={member.id}
                className="p-5 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4 hover:border-[#D5D0C5] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#E8E5DF]">
                      <AvatarFallback className="text-sm font-bold bg-[#F5EDD8] text-[#8B6914]">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A]">{member.name}</h4>
                      <p className="text-xs text-[#6B6B6B] truncate max-w-[150px]">{member.email}</p>
                      {member.phone && <p className="text-[11px] text-[#9A9A9A]">{member.phone}</p>}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#F0EDE8] text-[#9A9A9A]'
                    }`}
                  >
                    {member.status === 'active' ? 'Active' : 'Offline'}
                  </span>
                </div>

                {/* Event Scope Badges */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#9A9A9A]">Assigned Events</span>
                    <span className="text-[11px] font-bold text-[#8B6914]">
                      {member.checkInCount || 0} Scans
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {isAllEvents ? (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" /> All Events (Universal)
                      </span>
                    ) : (
                      assignedIds.map((evId) => {
                        const matchedEv = events.find((e) => e.id === evId);
                        return (
                          <span
                            key={evId}
                            className="text-[10px] font-semibold bg-[#F5EDD8] text-[#8B6914] border border-[#E0D0B0] px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-[190px]"
                            title={matchedEv?.name || 'Assigned Event'}
                          >
                            <Calendar className="w-3 h-3 text-[#C49A3C]" />
                            <span className="truncate">{matchedEv ? matchedEv.name : 'Event'}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Dynamic Role Switcher */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#9A9A9A]">Access Role</span>
                  <Select
                    value={member.role === 'admin' ? 'admin' : 'staff'}
                    onValueChange={(newRole: 'admin' | 'staff') => handleRoleChange(member, newRole)}
                  >
                    <SelectTrigger className="h-8.5 rounded-xl bg-white border-[#E8E5DF] text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff" className="text-xs font-medium">
                        📱 Scan Access (Mobile Scanner)
                      </SelectItem>
                      <SelectItem value="admin" className="text-xs font-medium">
                        🛡️ Admin Access (Full Console)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sync & Battery Status */}
                <div className="flex items-center justify-between text-[11px] text-[#9A9A9A] pt-1">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                    Live Sync Active
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-[#9A9A9A]" />
                    Mobile Scanner
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#F0EDE8] flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs rounded-xl border-[#E8E5DF] text-[#1A1A1A] hover:bg-[#FAFAF7]"
                    onClick={() => setSelectedStaffQR(member)}
                    leftIcon={<QrCode className="w-3.5 h-3.5 text-[#C49A3C]" />}
                  >
                    Fast Login QR
                  </Button>
                  <button
                    type="button"
                    title="Resend Credentials & Temporary Password Email"
                    disabled={resendingId === member.id}
                    onClick={() => handleResendCredentials(member)}
                    className="p-2 rounded-xl border border-[#E8E5DF] text-[#9A9A9A] hover:text-[#C49A3C] hover:bg-[#F5EDD8] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Mail className={cn("w-4 h-4", resendingId === member.id && "animate-spin")} />
                  </button>
                  <button
                    type="button"
                    title="Copy Scanner Link"
                    onClick={() => handleCopyLink(member)}
                    className="p-2 rounded-xl border border-[#E8E5DF] text-[#9A9A9A] hover:text-[#1A1A1A] hover:bg-[#FAFAF7] transition-colors cursor-pointer"
                  >
                    {copiedId === member.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    title="Remove Staff Member"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${member.name}?`)) {
                        deleteStaff(member.id);
                      }
                    }}
                    className="p-2 rounded-xl border border-[#E8E5DF] text-[#9A9A9A] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Fast Login QR Modal */}
      <Modal
        isOpen={!!selectedStaffQR}
        onClose={() => setSelectedStaffQR(null)}
        title="Scanner Quick Mobile Login"
        maxWidth="md"
      >
        <div className="text-center py-2 space-y-4">
          <p className="text-xs text-[#6B6B6B]">
            Scan this QR code with any staff smartphone to start scanning passes immediately without entering password.
          </p>

          <div className="p-4 bg-white rounded-3xl border border-[#E8E5DF] inline-block shadow-xs">
            <QRCodeDisplay
              value={`${window.location.origin}/login`}
              size={180}
              primaryColor="#1A1A1A"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] text-left text-xs space-y-1">
            <p><strong>Staff Operator:</strong> {selectedStaffQR?.name}</p>
            <p><strong>Access Role:</strong> {selectedStaffQR?.role === 'admin' ? '🛡️ Admin Access' : '📱 Scan Access'}</p>
            <p>
              <strong>Assigned Scope:</strong>{' '}
              {!selectedStaffQR?.assignedEventId || selectedStaffQR?.assignedEventId === 'all'
                ? '🌐 All Events (Universal)'
                : `${selectedStaffQR?.assignedEventId.split(',').length} Assigned Event(s)`}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => {
              if (selectedStaffQR) handleCopyLink(selectedStaffQR);
            }}
          >
            Copy Login Portal Link
          </Button>
        </div>
      </Modal>

      {/* Invite Staff Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staffName" className="text-xs font-semibold text-[#1A1A1A]">Full Name *</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <Input
                id="staffName"
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Rahul Sundar"
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staffEmail" className="text-xs font-semibold text-[#1A1A1A]">Email Address *</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <Input
                id="staffEmail"
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="rahul@abcevents.in"
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staffPhone" className="text-xs font-semibold text-[#1A1A1A]">Mobile (WhatsApp)</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
              <Input
                id="staffPhone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Event Assignment: All vs Specific */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#1A1A1A]">Event Assignment *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormEventScope('all');
                  setFormSelectedEventIds([]);
                }}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer text-left',
                  formEventScope === 'all'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                    : 'border-[#E8E5DF] bg-white text-[#3A3A3A] hover:bg-[#FAFAF7]'
                )}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold text-[11px]">All Events</p>
                  <p className={cn('text-[10px]', formEventScope === 'all' ? 'text-white/80' : 'text-[#9A9A9A]')}>
                    Universal access
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormEventScope('specific');
                  if (events.length > 0 && formSelectedEventIds.length === 0) {
                    setFormSelectedEventIds([activeEvent?.id || events[0].id]);
                  }
                }}
                className={cn(
                  'p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer text-left',
                  formEventScope === 'specific'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                    : 'border-[#E8E5DF] bg-white text-[#3A3A3A] hover:bg-[#FAFAF7]'
                )}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold text-[11px]">Specific Event(s)</p>
                  <p className={cn('text-[10px]', formEventScope === 'specific' ? 'text-white/80' : 'text-[#9A9A9A]')}>
                    Select 1 or more
                  </p>
                </div>
              </button>
            </div>

            {formEventScope === 'specific' && (
              <div className="mt-2 p-3 bg-[#FAFAF7] border border-[#E8E5DF] rounded-2xl space-y-2">
                <p className="text-[11px] font-semibold text-[#1A1A1A]">Select Assigned Event(s):</p>
                {events.length === 0 ? (
                  <p className="text-xs text-[#9A9A9A] italic">No events created yet. Staff will scan universal by default.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {events.map((ev) => {
                      const isChecked = formSelectedEventIds.includes(ev.id);
                      return (
                        <label
                          key={ev.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E8E5DF] hover:border-[#D5D0C5] cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormSelectedEventIds((prev) => [...prev, ev.id]);
                              } else {
                                setFormSelectedEventIds((prev) => prev.filter((id) => id !== ev.id));
                              }
                            }}
                            className="rounded border-[#D5D0C5] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                          />
                          <span className="font-medium text-[#1A1A1A] truncate">{ev.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1A1A1A]">Access Role *</Label>
            <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Select access role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">📱 Scan Access (Mobile Scanner Portal)</SelectItem>
                <SelectItem value="admin">🛡️ Admin Access (Full Console & Management)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3.5 bg-[#F5EDD8] border border-[#E0D0B0] rounded-2xl text-xs text-[#8B6914] flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-[#C49A3C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1A1A1A]">Login credentials will be emailed</p>
              <p className="text-[#6B6B6B] mt-0.5">
                Staff will receive their email + temporary password so they can log into the staff portal and start scanning attendees immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EDE8]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Mail className="w-4 h-4" />} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white">
              Send Invite & Email Credentials
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
