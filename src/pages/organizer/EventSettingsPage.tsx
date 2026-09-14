import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  Check,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventStatus } from '@/types';

export const EventSettingsPage: React.FC = () => {
  const {
    activeEvent,
    updateEvent,
    deleteEvent,
    navigateTo,
  } = useApp();

  const [name, setName] = useState(activeEvent?.name || '');
  const [description, setDescription] = useState(activeEvent?.description || '');
  const [status, setStatus] = useState<EventStatus>(activeEvent?.status || 'published');
  const [capacity, setCapacity] = useState(activeEvent?.settings.capacity || 1000);
  const [primaryColor, setPrimaryColor] = useState(activeEvent?.branding.primaryColor || '#C49A3C');
  const [coverImageUrl, setCoverImageUrl] = useState(activeEvent?.branding.coverImageUrl || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!activeEvent) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<Settings className="w-8 h-8 text-[#9A9A9A]" />}
          title="No Active Event Selected"
          description="Please create or select an event to configure its venue, capacities, branding, and registration status."
          primaryAction={{
            label: 'Create an Event',
            onClick: () => navigateTo('/app/events/new'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEvent(activeEvent.id, {
      name,
      description,
      status,
      branding: {
        ...activeEvent.branding,
        primaryColor,
        coverImageUrl,
      },
      settings: {
        ...activeEvent.settings,
        capacity,
      },
    });
  };

  const handleDelete = async () => {
    await deleteEvent(activeEvent.id);
    navigateTo('/app/events');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Event Configuration & Settings"
        subtitle={`Manage details, branding, capacity limits, and status for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Settings' },
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Details */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A9A9A] border-b border-[#F0EDE8] pb-2">
            General Information
          </h3>

          <div className="space-y-1.5">
            <Label htmlFor="event-name" className="text-xs font-semibold text-[#1A1A1A]">Event Name</Label>
            <Input
              id="event-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-desc" className="text-xs font-semibold text-[#1A1A1A]">Description</Label>
            <Textarea
              id="event-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-[#E8E5DF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Event Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="registration_open">Registration Open</SelectItem>
                  <SelectItem value="registration_closed">Registration Closed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity" className="text-xs font-semibold text-[#1A1A1A]">Max Capacity Limit</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className="font-bold rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A9A9A] border-b border-[#F0EDE8] pb-2">
            Branding & Visual Identity
          </h3>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#1A1A1A]">Event Primary Brand Color</Label>
            <div className="flex items-center gap-3">
              {['#C49A3C', '#1A1A1A', '#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#475569'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setPrimaryColor(col)}
                  className={`w-9 h-9 rounded-xl transition-transform flex items-center justify-center text-white cursor-pointer ${
                    primaryColor === col ? 'scale-110 ring-4 ring-[#E8E5DF] shadow-xs' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {primaryColor === col && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#1A1A1A]">Event Cover Banner Image</Label>
            <ImageUpload
              value={coverImageUrl}
              onChange={(base64Url) => setCoverImageUrl(base64Url)}
              recommendedResolution="1200 × 630 px"
              aspectRatioLabel="16:9 Landscape"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />} className="rounded-xl">
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-red-50/60 p-6 rounded-3xl border border-red-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Danger Zone
        </h3>
        <p className="text-xs text-red-700">
          Permanently delete this event and all associated registrations, QR tokens, and scan logs. This action is irreversible.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-red-600 border-red-300 hover:bg-red-100 rounded-xl"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Delete Event
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${activeEvent.name}"?`}
        message="Are you sure you want to permanently delete this event? All attendee registration records and scan histories will be deleted."
        confirmText="Delete Event"
        variant="danger"
      />
    </div>
  );
};
