import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  Palette,
  Layers,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EventStatus } from '../../types';

export const EventSettingsPage: React.FC = () => {
  const {
    activeEvent,
    updateEvent,
    deleteEvent,
    navigateTo,
    addToast,
  } = useApp();

  const [name, setName] = useState(activeEvent?.name || '');
  const [description, setDescription] = useState(activeEvent?.description || '');
  const [status, setStatus] = useState<EventStatus>(activeEvent?.status || 'published');
  const [capacity, setCapacity] = useState(activeEvent?.settings.capacity || 1000);
  const [primaryColor, setPrimaryColor] = useState(activeEvent?.branding.primaryColor || '#4f46e5');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event.</div>;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent(activeEvent.id, {
      name,
      description,
      status,
      branding: {
        ...activeEvent.branding,
        primaryColor,
      },
      settings: {
        ...activeEvent.settings,
        capacity,
      },
    });

    addToast({
      type: 'success',
      title: 'Settings Saved',
      description: 'Event configuration updated successfully.',
    });
  };

  const handleDelete = () => {
    deleteEvent(activeEvent.id);
    addToast({
      type: 'info',
      title: 'Event Deleted',
      description: `${activeEvent.name} has been removed.`,
    });
    navigateTo('/app/events');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            General Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium outline-none"
              >
                <option value="published">Published</option>
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity Limit</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Brand Accent Color
          </h3>

          <div className="flex items-center gap-3">
            {['#4f46e5', '#0284c7', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0f172a'].map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setPrimaryColor(col)}
                className={`w-9 h-9 rounded-xl transition-transform ${
                  primaryColor === col ? 'scale-110 ring-4 ring-slate-200' : ''
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-rose-900">Danger Zone</h3>
        <p className="text-xs text-rose-700">
          Permanently delete this event and all associated registrations, QR tokens, and scan logs. This action is irreversible.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-rose-600 border-rose-300 hover:bg-rose-100"
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
