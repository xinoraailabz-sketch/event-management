import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  MessageSquare,
  Send,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
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

export const MessagesPage: React.FC = () => {
  const {
    activeEvent,
    campaigns,
    addCampaign,
    navigateTo,
    addToast,
  } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('Instant WhatsApp QR Pass Broadcast');
  const [targetAudience, setTargetAudience] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [customBody, setCustomBody] = useState(
    `Dear {{name}},\n\nYour official delegate pass for {{event}} is confirmed.\n\nDate: {{date}}\nVenue: {{venue}}\n\nAccess your digital QR pass:\n{{pass_link}}\n\nPlease present this QR pass to any event staff or scanner desk for instant check-in.`
  );

  if (!activeEvent) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[#9A9A9A]" />}
          title="No Active Event Selected"
          description="Please create or select an event to broadcast WhatsApp QR passes and reminders to delegates."
          primaryAction={{
            label: 'Create an Event',
            onClick: () => navigateTo('/app/events/new'),
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const eventCampaigns = campaigns.filter((c) => c.eventId === activeEvent.id);
  const totalRegs = activeEvent.stats?.totalRegistrations ?? 0;
  const totalChecked = activeEvent.stats?.totalCheckedIn ?? 0;
  const unchecked = Math.max(0, totalRegs - totalChecked);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const count =
      targetAudience === 'all'
        ? totalRegs
        : targetAudience === 'checked_in'
        ? totalChecked
        : unchecked;

    await addCampaign({
      eventId: activeEvent.id,
      title: campaignTitle,
      channel: 'whatsapp',
      targetAudience,
      messageTemplate: customBody,
      sentCount: count,
      recipientCount: count,
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
        title="Broadcasts & Digital Passes"
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
            className="rounded-xl"
          >
            New Broadcast Campaign
          </Button>
        }
      />

      {/* Broadcast Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#9A9A9A] uppercase">Total Dispatched</p>
          <h3 className="text-2xl font-extrabold text-[#1A1A1A] mt-1">
            {eventCampaigns.reduce((a, c) => a + (c.sentCount || c.recipientCount || 0), 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Across active campaigns</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#9A9A9A] uppercase">Delivery Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">98.4%</h3>
          <p className="text-[11px] text-[#6B6B6B] mt-1">High-speed WhatsApp API</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#9A9A9A] uppercase">Read Rate</p>
          <h3 className="text-2xl font-extrabold text-[#1A1A1A] mt-1">89.2%</h3>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Average read in 4 minutes</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#9A9A9A] uppercase">Passes Opened</p>
          <h3 className="text-2xl font-extrabold text-[#C49A3C] mt-1">82.6%</h3>
          <p className="text-[11px] text-[#6B6B6B] mt-1">QR tickets loaded on phone</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
        <h3 className="text-base font-bold text-[#1A1A1A]">Broadcast Campaign History</h3>

        <div className="divide-y divide-[#F0EDE8]">
          {eventCampaigns.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9A9A9A]">
              No broadcast campaigns created yet.
            </div>
          ) : (
            eventCampaigns.map((camp) => (
              <div key={camp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1A1A1A] text-sm">{camp.title}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      WhatsApp Verified
                    </span>
                  </div>
                  <p className="text-[#6B6B6B]">
                    Target: <strong className="capitalize text-[#1A1A1A]">{(camp.targetAudience || '').replace('_', ' ')}</strong> • Sent on {camp.sentAt ? camp.sentAt.split('T')[0] : 'Today'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[#6B6B6B]">
                  <div>
                    <span className="text-[#9A9A9A] block text-[10px] uppercase">Sent</span>
                    <span className="font-bold text-[#1A1A1A]">{camp.sentCount || camp.recipientCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[#9A9A9A] block text-[10px] uppercase">Delivered</span>
                    <span className="font-bold text-emerald-600">{camp.deliveredCount || Math.round((camp.recipientCount || 0) * 0.98)}</span>
                  </div>
                  <div>
                    <span className="text-[#9A9A9A] block text-[10px] uppercase">Read</span>
                    <span className="font-bold text-[#1A1A1A]">{camp.readCount || Math.round((camp.recipientCount || 0) * 0.89)}</span>
                  </div>
                  <div>
                    <span className="text-[#9A9A9A] block text-[10px] uppercase">Pass Open</span>
                    <span className="font-bold text-[#C49A3C]">{camp.passDownloadedCount || Math.round((camp.recipientCount || 0) * 0.76)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
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
            <div className="space-y-1.5">
              <Label htmlFor="campaignTitle" className="text-xs font-semibold text-[#1A1A1A]">Campaign Title</Label>
              <Input
                id="campaignTitle"
                type="text"
                required
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Target Audience</Label>
              <Select value={targetAudience} onValueChange={(val: any) => setTargetAudience(val)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registered Delegates ({totalRegs})</SelectItem>
                  <SelectItem value="not_checked_in">Unchecked-in Only ({unchecked})</SelectItem>
                  <SelectItem value="checked_in">Checked-in Only ({totalChecked})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customBody" className="text-xs font-semibold text-[#1A1A1A]">WhatsApp Message Body</Label>
              <Textarea
                id="customBody"
                rows={7}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="font-mono text-xs rounded-xl border-[#E8E5DF]"
              />
              <p className="text-[10px] text-[#9A9A9A]">
                Dynamic tags: {'{{name}}'}, {'{{event}}'}, {'{{date}}'}, {'{{venue}}'}, {'{{pass_link}}'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EDE8]">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />} className="rounded-xl">
                Send WhatsApp Broadcast Now
              </Button>
            </div>
          </div>

          {/* Right Preview (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAFAF7] p-4 rounded-3xl border border-[#E8E5DF] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] block mb-3">
                Live WhatsApp Preview
              </span>

              {/* Smartphone Chat Bubble Mockup */}
              <div className="bg-[#1A1A1A] rounded-2xl p-3 text-white text-xs shadow-md">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                  <div className="w-6 h-6 rounded-full bg-[#C49A3C] flex items-center justify-center font-bold text-[10px] text-white">
                    EF
                  </div>
                  <div>
                    <p className="font-bold text-[11px]">EventFlow Notifications</p>
                    <p className="text-[9px] text-[#9A9A9A]">Verified Account</p>
                  </div>
                </div>

                <div className="bg-[#2A2A2A] p-3 rounded-xl text-slate-100 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#9A9A9A] text-center mt-3">
              Instant delivery via high-speed API
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
