import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  Plus,
  Search,
  LayoutGrid,
  List,
  QrCode,
  ExternalLink,
  MapPin,
  Clock,
  Users,
  Check,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

export const EventsListPage: React.FC = () => {
  const { events, currentOrg, navigateTo, setActiveEventId, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const orgEvents = events.filter((e) => e.organizationId === currentOrg.id);

  const filteredEvents = orgEvents.filter((event) => {
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      (event.name || '').toLowerCase().includes(q) ||
      (event.city || '').toLowerCase().includes(q) ||
      (event.venueName || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = (eventSlug: string, eventId: string) => {
    const url = `${window.location.origin}/e/${eventSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    addToast({
      type: 'success',
      title: 'Registration Link Copied',
      description: `Copied /e/${eventSlug} to clipboard.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Events"
        subtitle="Create, manage registrations, configure passes, and monitor entrance check-ins."
        breadcrumbs={[{ label: 'Dashboard', onClick: () => navigateTo('/app') }, { label: 'Events' }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('/app/events/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Event
          </Button>
        }
      />

      {/* Filter and Search Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E8E5DF]/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
          <Input
            type="text"
            placeholder="Search events by name, city, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="registration_open">Registration Open</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#F0EDE8] border border-[#E8E5DF]/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#9A9A9A] hover:text-[#1A1A1A]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#9A9A9A] hover:text-[#1A1A1A]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6 text-[#9A9A9A]" />}
          title="No events found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try changing your search terms or filters.'
              : 'Create your first event and start collecting delegate registrations with instant QR passes.'
          }
          primaryAction={{
            label: 'Create New Event',
            onClick: () => navigateTo('/app/events/new'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const regs = event.stats?.totalRegistrations || 0;
            const checked = event.stats?.totalCheckedIn || 0;
            const turnOut = event.stats?.attendancePercentage || 0;
            const capacity = event.settings?.capacity || 1;
            const capacityPct = Math.round((regs / capacity) * 100);

            return (
              <div
                key={event.id}
                className="rounded-3xl bg-white border border-[#E8E5DF]/70 hover:border-[#D5D0C8] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Event Cover Image */}
                <div className="h-36 bg-[#1A1A1A] relative overflow-hidden">
                  {event.branding?.coverImageUrl ? (
                    <img
                      src={event.branding.coverImageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A]" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge status={event.status} size="sm" className="bg-white/95 text-[#1A1A1A] font-bold shadow-xs" />
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(event.slug, event.id)}
                      className="p-1.5 rounded-lg bg-[#1A1A1A]/70 hover:bg-[#1A1A1A] text-white backdrop-blur-xs transition-colors cursor-pointer"
                      title="Copy Public Link"
                    >
                      {copiedId === event.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => navigateTo(`/e/${event.slug}`)}
                      className="p-1.5 rounded-lg bg-[#1A1A1A]/70 hover:bg-[#1A1A1A] text-white backdrop-blur-xs transition-colors cursor-pointer"
                      title="Open Public Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-3 text-white text-[11px] font-semibold bg-[#1A1A1A]/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {event.category}
                  </div>
                </div>

                {/* Event Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A1A] group-hover:text-[#C49A3C] transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-[#6B6B6B]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />
                        <span>{formatDate(event.date)}</span>
                        <span>•</span>
                        <span>{event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#9A9A9A] shrink-0" />
                        <span className="truncate">{event.venueName}, {event.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance & Capacity Meter */}
                  <div className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6B6B] font-medium">Registrations</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {regs.toLocaleString()} / {(event.settings?.capacity || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-[#F0EDE8] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C49A3C] h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, capacityPct)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-0.5">
                      <span>Checked In: <strong className="text-emerald-700">{checked}</strong></span>
                      <span className="font-semibold text-[#C49A3C]">{turnOut}% Attendance</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EDE8]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}`);
                      }}
                      className="text-xs px-2 rounded-xl"
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}/registrations`);
                      }}
                      className="text-xs px-2 rounded-xl"
                    >
                      Attendees
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}/scanner`);
                      }}
                      className="text-xs px-2 rounded-xl"
                      leftIcon={<QrCode className="w-3 h-3" />}
                    >
                      Scan
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-[#E8E5DF]/60 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <table className="w-full text-left text-xs text-[#6B6B6B]">
            <thead className="bg-[#FAFAF7] border-b border-[#F0EDE8] text-[#1A1A1A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Date & City</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4">Checked In</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#8B6914] font-bold shrink-0">
                        {event.name.charAt(0)}
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setActiveEventId(event.id);
                            navigateTo(`/app/events/${event.id}`);
                          }}
                          className="font-bold text-[#1A1A1A] hover:text-[#C49A3C] transition-colors text-left cursor-pointer"
                        >
                          {event.name}
                        </button>
                        <p className="text-[11px] text-[#9A9A9A]">{event.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#1A1A1A]">{formatDate(event.date)}</p>
                    <p className="text-[11px] text-[#9A9A9A]">{event.city}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                    {event.stats?.totalRegistrations || 0} / {event.settings?.capacity || 0}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">
                    {event.stats?.totalCheckedIn || 0} ({event.stats?.attendancePercentage || 0}%)
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={event.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveEventId(event.id);
                          navigateTo(`/app/events/${event.id}`);
                        }}
                      >
                        Manage
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveEventId(event.id);
                          navigateTo(`/app/events/${event.id}/scanner`);
                        }}
                        leftIcon={<QrCode className="w-3 h-3" />}
                      >
                        Scan
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
