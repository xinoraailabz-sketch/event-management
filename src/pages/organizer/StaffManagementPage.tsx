import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  ShieldCheck,
  Smartphone,
  Battery,
  Wifi,
  QrCode,
  CheckCircle2,
  Trash2,
  Share2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { QRCodeDisplay } from '../../components/common/QRCodeDisplay';
import { StaffMember } from '../../types';

export const StaffManagementPage: React.FC = () => {
  const {
    activeEvent,
    staff,
    staffList,
    addStaffMember,
    navigateTo,
    addToast,
  } = useApp();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStaffQR, setSelectedStaffQR] = useState<StaffMember | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'scanner' | 'lead_coordinator' | 'receptionist'>('scanner');

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event.</div>;
  }

  const allStaff = staff || staffList || [];
  const eventStaff = allStaff.filter(
    (s) => s.assignedEventId === activeEvent.id || s.eventId === activeEvent.id || s.assignedEventId === 'all'
  );

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;

    addStaffMember({
      name: formName,
      email: formEmail,
      phone: formPhone || '+91 98000 00000',
      role: formRole,
      assignedGate: 'Any Location',
      assignedEntrance: 'Any Location',
      assignedEventId: activeEvent.id,
      status: 'active',
      checkInCount: 0,
    });

    addToast({
      type: 'success',
      title: 'Staff Invited',
      description: `${formName} added as scanner operator with universal scan access.`,
    });

    setIsInviteModalOpen(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Check-In Staff & Scanner Operators"
        subtitle={`Equip and manage check-in staff to scan delegates anywhere across ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Staff Management' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Invite Scanner Staff
          </Button>
        }
      />

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {eventStaff.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {member.status === 'active' ? 'Active' : 'Offline'}
              </span>
            </div>

            {/* Scope & Verified Count */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Scan Access</p>
                <p className="font-bold text-indigo-700 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Any Location
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Verified</p>
                <p className="font-bold text-emerald-700 mt-0.5">{member.checkInCount} delegates</p>
              </div>
            </div>

            {/* Sync & Battery Status */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-500" />
                Live Sync Active
              </span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-400" />
                Mobile Scanner Ready
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setSelectedStaffQR(member)}
                leftIcon={<QrCode className="w-3.5 h-3.5" />}
              >
                Fast Phone Login QR
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Fast Login QR Modal */}
      <Modal
        isOpen={!!selectedStaffQR}
        onClose={() => setSelectedStaffQR(null)}
        title="Scanner Quick Mobile Login"
        maxWidth="md"
      >
        <div className="text-center py-2 space-y-4">
          <p className="text-xs text-slate-500">
            Scan this QR code with any staff smartphone to start scanning passes anywhere immediately without password entry.
          </p>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-xs">
            <QRCodeDisplay
              value={`${window.location.origin}/app/events/${activeEvent.id}/scanner?staffToken=${selectedStaffQR?.loginToken || 'staff-token'}`}
              size={180}
              primaryColor="#4f46e5"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <p><strong>Staff Operator:</strong> {selectedStaffQR?.name}</p>
            <p><strong>Scan Permission:</strong> Universal (Can scan any attendee at any spot)</p>
            <p><strong>Assigned Event:</strong> {activeEvent.name}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/app/events/${activeEvent.id}/scanner?staffToken=${selectedStaffQR?.loginToken || 'staff-token'}`
              );
              addToast({ type: 'success', title: 'Login Link Copied', description: 'WhatsApp shareable scanner link copied.' });
            }}
          >
            Copy WhatsApp Login Link
          </Button>
        </div>
      </Modal>

      {/* Invite Staff Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Scanner Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Rahul Sundar"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="rahul@abcevents.in"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile (WhatsApp)</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Responsibility</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium outline-none"
            >
              <option value="scanner">Scanner Operator (Can scan anywhere)</option>
              <option value="lead_coordinator">Lead Coordinator</option>
              <option value="receptionist">Receptionist / Desk Operator</option>
            </select>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Staff can use their phone camera or any connected scanner device to verify attendee passes at any spot across the venue.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Send Staff Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
