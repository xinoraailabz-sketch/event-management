import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  QrCode,
  Share2,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { AttendeeDetailsDrawer } from './AttendeeDetailsDrawer';
import { AddAttendeeModal } from './AddAttendeeModal';
import { Attendee } from '../../types';
import { formatDate, formatDateTime, exportToCSV } from '../../lib/utils';

export const AttendeeListPage: React.FC = () => {
  const {
    activeEvent,
    attendees,
    checkInAttendee,
    undoCheckIn,
    navigateTo,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event.</div>;
  }

  const eventAttendees = attendees.filter((a) => a.eventId === activeEvent.id);

  const filteredAttendees = eventAttendees.filter((attendee) => {
    const query = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      (attendee.fullName || '').toLowerCase().includes(query) ||
      (attendee.email || '').toLowerCase().includes(query) ||
      (attendee.registrationId || '').toLowerCase().includes(query) ||
      (attendee.phone || '').includes(query) ||
      ((attendee.company || '').toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'all' || attendee.status === statusFilter;
    const matchesTicket = ticketFilter === 'all' || attendee.ticketType === ticketFilter;

    return matchesSearch && matchesStatus && matchesTicket;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAttendees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAttendees.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkCheckIn = () => {
    selectedIds.forEach((id) => {
      checkInAttendee(id, 'Universal Scanner', 'Bulk Check-In Admin');
    });
    addToast({
      type: 'success',
      title: 'Bulk Check-in Completed',
      description: `Checked in ${selectedIds.length} delegates.`,
    });
    setSelectedIds([]);
  };

  const handleExport = () => {
    const list = selectedIds.length > 0
      ? eventAttendees.filter((a) => selectedIds.includes(a.id))
      : filteredAttendees;

    exportToCSV(
      list.map((a) => ({
        'Registration ID': a.registrationId,
        'Full Name': a.fullName,
        Email: a.email,
        Phone: a.phone,
        Company: a.company || '',
        'Job Title': a.jobTitle || '',
        'Ticket Type': a.ticketType,
        Status: a.status,
        'Registered At': a.registeredAt,
        'Checked In At': a.checkedInAt || 'N/A',
        'Entrance Gate': a.checkedInGate || 'N/A',
      })),
      `${activeEvent.slug}-attendees-list.csv`
    );

    addToast({
      type: 'success',
      title: 'CSV Exported',
      description: `Exported ${list.length} records.`,
    });
  };

  const handleCopyId = (regId: string) => {
    navigator.clipboard.writeText(regId);
    setCopiedId(regId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Registrations & Attendees"
        subtitle={`Total of ${eventAttendees.length} registered delegates for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Registrations' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Attendee
            </Button>
          </div>
        }
      />

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, ID, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered (Unchecked)</option>
              <option value="checked_in">Checked In</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Delegate Tiers</option>
              <option value="General Attendee">General Attendee</option>
              <option value="VIP Delegate">VIP Delegate</option>
              <option value="Founder / CXO">Founder / CXO</option>
              <option value="Speaker / Panelist">Speaker / Panelist</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Banner (appears when items are checked) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
            <span className="font-semibold text-indigo-900">
              {selectedIds.length} attendees selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkCheckIn}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1"
              >
                Mark Checked In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-xs py-1"
              >
                Export Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Attendee Data Table */}
      {filteredAttendees.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No attendees found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No records match your search query.'
              : 'Register delegates manually or share the public registration link.'
          }
          primaryAction={{
            label: 'Add Attendee',
            onClick: () => setIsAddModalOpen(true),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-700">
                      {selectedIds.length === filteredAttendees.length && filteredAttendees.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Delegate Name</th>
                  <th className="py-3 px-4">Reg ID</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-in Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <button onClick={() => toggleSelectOne(att.id)} className="text-slate-400 hover:text-slate-700">
                        {selectedIds.includes(att.id) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Delegate Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                          {att.fullName.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedAttendee(att)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                          >
                            {att.fullName}
                          </button>
                          <p className="text-[11px] text-slate-400">
                            {att.jobTitle ? `${att.jobTitle}, ` : ''}{att.company || 'Individual'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Reg ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                        <span>{att.registrationId}</span>
                        <button
                          onClick={() => handleCopyId(att.registrationId)}
                          className="text-slate-400 hover:text-slate-600"
                          title="Copy ID"
                        >
                          {copiedId === att.registrationId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800">{att.email}</p>
                      <p className="text-[11px] text-slate-400">{att.phone}</p>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {att.ticketType}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge status={att.status} size="sm" />
                    </td>

                    {/* Check-in Details */}
                    <td className="py-3.5 px-4">
                      {att.status === 'checked_in' ? (
                        <div>
                          <p className="font-semibold text-emerald-700 text-[11px]">
                            Verified
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {att.checkedInAt?.split('T')[1]?.substring(0, 5) || 'Checked in'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {att.status === 'checked_in' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => undoCheckIn(att.id)}
                            className="text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkInAttendee(att.id, 'Entrance A', 'Admin')}
                            className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            Check-In
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAttendee(att)}
                          className="text-xs"
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredAttendees.length} of {eventAttendees.length} registered delegates</span>
            <span>EventFlow Registry</span>
          </div>
        </div>
      )}

      {/* Drawers & Modals */}
      <AttendeeDetailsDrawer
        attendee={selectedAttendee}
        isOpen={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
      />

      <AddAttendeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
