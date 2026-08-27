import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { User, Mail, Phone, Building, Briefcase } from 'lucide-react';

interface AddAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAttendeeModal: React.FC<AddAttendeeModalProps> = ({ isOpen, onClose }) => {
  const { activeEvent, registerAttendee, addToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [ticketType, setTicketType] = useState('General Attendee');
  const [city, setCity] = useState('Madurai');

  if (!activeEvent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    registerAttendee(activeEvent.id, {
      fullName,
      email,
      phone: phone || '+91 98000 00000',
      company,
      jobTitle,
      ticketType,
      city,
    });

    addToast({
      type: 'success',
      title: 'Attendee Registered',
      description: `${fullName} has been added and a QR pass generated.`,
    });

    onClose();
    // Reset
    setFullName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setJobTitle('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Delegate" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Anand Kumar"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anand@example.com"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. ABC Technologies"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Managing Director"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delegate Tier</label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            >
              <option value="General Attendee">General Attendee</option>
              <option value="VIP Delegate">VIP Delegate</option>
              <option value="Founder / CXO">Founder / CXO</option>
              <option value="Speaker / Panelist">Speaker / Panelist</option>
              <option value="Press / Media">Press / Media</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit">
            Create Attendee & Issue Pass
          </Button>
        </div>
      </form>
    </Modal>
  );
};
