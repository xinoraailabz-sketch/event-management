import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, Building, Briefcase, MapPin, Ticket } from 'lucide-react';

import { EventItem } from '@/types';

interface AddAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEvent?: EventItem | null;
}

export const AddAttendeeModal: React.FC<AddAttendeeModalProps> = ({ isOpen, onClose, targetEvent }) => {
  const { activeEvent, events, registerAttendee, addToast } = useApp();
  const event = targetEvent || activeEvent || (events.length > 0 ? events[0] : null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [ticketType, setTicketType] = useState('General Attendee');
  const [city, setCity] = useState(event?.city || 'Madurai');

  if (!event) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    try {
      await registerAttendee(
        event.id,
        {
          fullName,
          email,
          phone: phone || '+91 98000 00000',
          company,
          jobTitle,
          ticketType,
          city: city || event.city || '',
        },
        event
      );

      onClose();
      // Reset
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setJobTitle('');
    } catch (err: any) {
      console.error('Error adding attendee:', err);
      addToast({
        type: 'error',
        title: 'Registration Blocked',
        description: err?.message || 'Could not register delegate.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Register New Delegate — ${event.name}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullname">Full Name *</Label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Kumar"
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anand@example.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile / WhatsApp Number</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company / Organization</Label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. ABC Technologies"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Designation / Role</Label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Managing Director"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Delegate Tier</Label>
            <Select value={ticketType} onValueChange={setTicketType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Attendee">General Attendee</SelectItem>
                <SelectItem value="VIP Delegate">VIP Delegate</SelectItem>
                <SelectItem value="Founder / CXO">Founder / CXO</SelectItem>
                <SelectItem value="Speaker / Panelist">Speaker / Panelist</SelectItem>
                <SelectItem value="Press / Media">Press / Media</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            Create Attendee & Issue Pass
          </Button>
        </div>
      </form>
    </Modal>
  );
};
