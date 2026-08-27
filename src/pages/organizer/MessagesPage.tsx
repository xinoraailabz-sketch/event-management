import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Smartphone,
  Users,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { MessageCampaign } from '../../types';

export const MessagesPage: React.FC = () => {
  const {
    activeEvent,
    campaigns,
    addCampaign,
    navigateTo,
    addToast,
  } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('pass_delivery');
  const [campaignTitle, setCampaignTitle] = useState('Instant WhatsApp QR Pass Broadcast');
  const [targetAudience, setTargetAudience] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [customBody, setCustomBody] = useState(
    `Dear {{name}},\n\nYour official delegate pass for {{event}} is confirmed.\n\nDate: {{date}}\nVenue: {{venue}}\n\nAccess your digital QR pass:\n{{pass_link}}\n\nPlease present this QR pass to any event staff or scanner desk for instant check-in.`
  );

  if (!activeEvent) {
    return <div className="p-8 text-center text-slate-500">Please select an event.</div>;
  }

  const eventCampaigns = campaigns.filter((c) => c.eventId === activeEvent.id);
  const totalRegs = activeEvent.stats?.totalRegistrations ?? 0;
  const totalChecked = activeEvent.stats?.totalCheckedIn ?? 0;
  const unchecked = Math.max(0, totalRegs - totalChecked);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const count =
      targetAudience === 'all'
        ? totalRegs
        : targetAudience === 'checked_in'
        ? totalChecked
        : unchecked;

    addCampaign({
      eventId: activeEvent.id,
      title: campaignTitle,
      channel: 'whatsapp',
      targetAudience,
      messageTemplate: customBody,
      sentCount: count,
      deliveredCount: Math.round(count * 0.98),
      readCount: Math.round(count * 0.89),
      passDownloadedCount: Math.round(count * 0.76),
      status: 'sent',
      sentAt: new Date().toISOString(),
    });

    addToast({
      type: 'success',
      title: 'WhatsApp Broadcast Dispatched',
      description: `Sent pass messages to ${count} delegates.`,
    });

    setIsNewModalOpen(false);
  };

  // Preview replacement
  const previewText = (customBody || '')
    .replace('{{name}}', 'Ananya Iyer')
    .replace('{{event}}', activeEvent?.name || 'Event')
    .replace('{{date}}', activeEvent?.date || 'Upcoming')
    .replace('{{venue}}', activeEvent?.venueName || 'Main Venue')
    .replace('{{pass_link}}', `https://app.eventflow.in/e/${activeEvent?.slug || 'event'}/pass/att-01`);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="WhatsApp & Email Pass Broadcasts"
        subtitle={`Automated ticket delivery, reminders, and notifications for ${activeEvent.name}`}
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: activeEvent.name, onClick: () => navigateTo(`/app/events/${activeEvent.id}`) },
          { label: 'Messages & Passes' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Send className="w-4 h-4" />}
          >
            New Broadcast Campaign
          </Button>
        }
      />

      {/* Broadcast Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Dispatched</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {eventCampaigns.reduce((a, c) => a + c.sentCount, 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Across 3 active campaigns</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase">Delivery Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">98.4%</h3>
          <p className="text-[11px] text-emerald-700 mt-1">High-speed WhatsApp API</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase">Read Rate</p>
          <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">89.2%</h3>
          <p className="text-[11px] text-slate-500 mt-1">Average read in 4 minutes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase">Passes Opened</p>
          <h3 className="text-2xl font-extrabold text-sky-600 mt-1">82.6%</h3>
          <p className="text-[11px] text-slate-500 mt-1">QR tickets loaded on phone</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Broadcast Campaign History</h3>

        <div className="divide-y divide-slate-100">
          {eventCampaigns.map((camp) => (
            <div key={camp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{camp.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                    WhatsApp Verified
                  </span>
                </div>
                <p className="text-slate-500">
                  Target: <strong className="capitalize text-slate-700">{(camp.targetAudience || '').replace('_', ' ')}</strong> • Sent on {camp.sentAt ? camp.sentAt.split('T')[0] : 'Today'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Sent</span>
                  <span className="font-bold text-slate-900">{camp.sentCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Delivered</span>
                  <span className="font-bold text-emerald-600">{camp.deliveredCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Read</span>
                  <span className="font-bold text-indigo-600">{camp.readCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Pass Open</span>
                  <span className="font-bold text-sky-600">{camp.passDownloadedCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Broadcast Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Broadcast Digital QR Pass to Delegates"
        maxWidth="2xl"
      >
        <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium outline-none"
              >
                <option value="all">All Registered Delegates ({totalRegs})</option>
                <option value="not_checked_in">Unchecked-in Only ({unchecked})</option>
                <option value="checked_in">Checked-in Only ({totalChecked})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Message Body</label>
              <textarea
                rows={7}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dynamic tags: {'{{name}}'}, {'{{event}}'}, {'{{date}}'}, {'{{venue}}'}, {'{{pass_link}}'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                Send WhatsApp Broadcast Now
              </Button>
            </div>
          </div>

          {/* Right Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Live WhatsApp Preview
              </span>

              {/* Smartphone Chat Bubble Mockup */}
              <div className="bg-emerald-900 rounded-2xl p-3 text-white text-xs shadow-md">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px]">
                    EF
                  </div>
                  <div>
                    <p className="font-bold text-[11px]">EventFlow Notifications</p>
                    <p className="text-[9px] text-emerald-300">Verified Business Account</p>
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-3 rounded-xl text-slate-100 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              Instant delivery via high-speed API
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
