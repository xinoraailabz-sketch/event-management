import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Users,
  Search,
  Plus,
  Download,
  CheckCircle2,
  Copy,
  Check,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttendeeDetailsDrawer } from './AttendeeDetailsDrawer';
import { AddAttendeeModal } from './AddAttendeeModal';
import { Attendee } from '@/types';
import { exportToCSV } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const AttendeeListPage: React.FC = () => {
  const {
    activeEvent,
    events,
    setActiveEventId,
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

  // Selected event filter state (defaults to activeEvent if available, or 'all')
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return activeEvent?.id || (events.length > 0 ? events[0].id : 'all');
  });

  // Sync selectedEventId if activeEvent changes externally
  React.useEffect(() => {
    if (activeEvent?.id && selectedEventId !== activeEvent.id && selectedEventId !== 'all') {
      setSelectedEventId(activeEvent.id);
    }
  }, [activeEvent?.id]);

  if (events.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<Users className="w-8 h-8 text-[#9A9A9A]" />}
          title="No Events Found"
          description="Please create an event first to view, register, and manage delegate attendees."
          primaryAction={{
            label: 'Create an Event',
            onClick: () => navigateTo('/app/events/new'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const currentEvent = events.find((e) => e.id === selectedEventId) || (selectedEventId === 'all' ? null : activeEvent);

  const eventAttendees = selectedEventId === 'all'
    ? attendees
    : attendees.filter((a) => a.eventId === selectedEventId);

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
        Event: a.eventName || events.find((e) => e.id === a.eventId)?.name || 'Event',
        Company: a.company || '',
        'Job Title': a.jobTitle || '',
        'Ticket Type': a.ticketType,
        Status: a.status,
        'Registered At': a.registeredAt,
        'Checked In At': a.checkedInAt || 'N/A',
        'Entrance Gate': a.checkedInEntrance || 'Universal Desk',
      })),
      currentEvent ? `${currentEvent.slug}-attendees-list.csv` : 'all-events-attendees-list.csv'
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
        subtitle={
          currentEvent
            ? `Total of ${eventAttendees.length} registered delegates for ${currentEvent.name}`
            : `Total of ${eventAttendees.length} registered delegates across all ${events.length} events`
        }
        breadcrumbs={
          currentEvent
            ? [
                { label: 'Events', onClick: () => navigateTo('/app/events') },
                { label: currentEvent.name, onClick: () => navigateTo(`/app/events/${currentEvent.id}`) },
                { label: 'Registrations' },
              ]
            : [
                { label: 'Events', onClick: () => navigateTo('/app/events') },
                { label: 'All Registrations' },
              ]
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
              className="rounded-xl"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="rounded-xl"
            >
              Add Attendee
            </Button>
          </div>
        }
      />

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, ID, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Event Filter */}
            <div className="w-56 sm:w-64">
              <Select
                value={selectedEventId}
                onValueChange={(val) => {
                  setSelectedEventId(val);
                  if (val !== 'all') {
                    setActiveEventId(val);
                  }
                }}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white border-[#E8E5DF]">
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="w-3.5 h-3.5 text-[#C49A3C] shrink-0" />
                    <SelectValue placeholder="All Events" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Events ({events.length})
                  </SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="registered">Registered (Unchecked)</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tier Filter */}
            <div className="w-44">
              <Select value={ticketFilter} onValueChange={setTicketFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl">
                  <SelectValue placeholder="All Delegate Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Delegate Tiers</SelectItem>
                  <SelectItem value="General Attendee">General Attendee</SelectItem>
                  <SelectItem value="VIP Delegate">VIP Delegate</SelectItem>
                  <SelectItem value="Founder / CXO">Founder / CXO</SelectItem>
                  <SelectItem value="Speaker / Panelist">Speaker / Panelist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5EDD8] border border-[#E0D0B0] text-xs">
            <span className="font-semibold text-[#8B6914] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C49A3C]" />
              {selectedIds.length} attendees selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkCheckIn}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1 rounded-xl"
              >
                Mark Checked In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                className="text-xs py-1 rounded-xl"
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
          icon={<Users className="w-6 h-6 text-[#9A9A9A]" />}
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
        <div className="bg-white rounded-3xl border border-[#E8E5DF]/70 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#6B6B6B]">
              <thead className="bg-[#FAFAF7] border-b border-[#F0EDE8] text-[#1A1A1A] font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-8">
                    <button onClick={handleSelectAll} className="text-[#9A9A9A] hover:text-[#1A1A1A] cursor-pointer">
                      {selectedIds.length === filteredAttendees.length && filteredAttendees.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#1A1A1A]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Delegate Name</th>
                  <th className="py-3.5 px-4">Reg ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Tier</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Check-in Details</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3.5 px-4">
                      <button onClick={() => toggleSelectOne(att.id)} className="text-[#9A9A9A] hover:text-[#1A1A1A] cursor-pointer">
                        {selectedIds.includes(att.id) ? (
                          <CheckSquare className="w-4 h-4 text-[#1A1A1A]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Delegate Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-[#E8E5DF]">
                          <AvatarFallback className="text-xs font-bold bg-[#F5EDD8] text-[#8B6914]">
                            {att.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <button
                            onClick={() => setSelectedAttendee(att)}
                            className="font-bold text-[#1A1A1A] hover:text-[#C49A3C] transition-colors text-left cursor-pointer"
                          >
                            {att.fullName}
                          </button>
                          <p className="text-[11px] text-[#9A9A9A]">
                            {att.jobTitle ? `${att.jobTitle}, ` : ''}{att.company || 'Individual'}
                          </p>
                          {selectedEventId === 'all' && (
                            <span className="inline-flex items-center mt-0.5 px-2 py-0.5 rounded-md bg-[#F5EDD8]/80 text-[#8B6914] text-[10px] font-semibold truncate max-w-[200px]">
                              {att.eventName || events.find((e) => e.id === att.eventId)?.name || 'Event'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reg ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#1A1A1A]">
                        <span>{att.registrationId}</span>
                        <button
                          onClick={() => handleCopyId(att.registrationId)}
                          className="text-[#9A9A9A] hover:text-[#1A1A1A] cursor-pointer"
                          title="Copy ID"
                        >
                          {copiedId === att.registrationId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <p className="text-[#1A1A1A]">{att.email}</p>
                      <p className="text-[11px] text-[#9A9A9A]">{att.phone}</p>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#5A5A5A] font-semibold text-[10px]">
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
                          <p className="text-[10px] text-[#9A9A9A]">
                            {att.checkedInAt?.split('T')[1]?.substring(0, 5) || 'Checked in'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#9A9A9A]">—</span>
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
                            className="text-xs text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkInAttendee(att.id, 'Universal Desk', 'Admin')}
                            className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                          >
                            Check-In
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAttendee(att)}
                          className="text-xs rounded-xl"
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
          <div className="px-4 py-3 bg-[#FAFAF7] border-t border-[#F0EDE8] flex items-center justify-between text-xs text-[#9A9A9A]">
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
        targetEvent={currentEvent}
      />
    </div>
  );
};
