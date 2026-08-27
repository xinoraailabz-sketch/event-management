import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  QrCode,
  MapPin,
  Clock,
  Layers,
  Palette,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { RegistrationField, FieldType, EventItem } from '../../types';
import confetti from 'canvas-confetti';

export const CreateEventWizard: React.FC = () => {
  const { currentOrg, createEvent, publishEvent, navigateTo, addToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [publishedModalOpen, setPublishedModalOpen] = useState<boolean>(false);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Form State
  const [basicDetails, setBasicDetails] = useState({
    name: 'Madurai AI & SaaS Conclave 2026',
    description: 'South India’s premier conference on generative AI engineering, B2B SaaS scaling, cross-border venture capital, and digital commerce transformation.',
    category: 'Conference & Summit',
    date: '2026-10-25',
    startTime: '09:00 AM',
    endTime: '05:30 PM',
    venueName: 'Madurai World Trade Centre, Grand Auditorium',
    venueAddress: '100 Feet Ring Road',
    city: 'Madurai',
    organizerName: currentOrg.ownerName,
    organizerContact: currentOrg.phone,
    organizerEmail: currentOrg.ownerEmail,
    website: 'https://conclave2026.in',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#4f46e5',
    coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    theme: 'light' as const,
  });

  const [fields, setFields] = useState<RegistrationField[]>([
    { id: 'f_name', label: 'Full Name', type: 'text', required: true, systemField: true, placeholder: 'e.g. Arun Kumar' },
    { id: 'f_email', label: 'Work Email', type: 'email', required: true, systemField: true, placeholder: 'arun@company.com' },
    { id: 'f_phone', label: 'Mobile Number (WhatsApp)', type: 'phone', required: true, systemField: true, placeholder: '+91 98765 43210' },
    { id: 'f_company', label: 'Company / Startup Name', type: 'text', required: true, placeholder: 'e.g. ABC Technologies' },
    { id: 'f_designation', label: 'Designation / Role', type: 'text', required: true, placeholder: 'e.g. Founder & CEO' },
    { id: 'f_experience', label: 'Delegate Category', type: 'dropdown', required: true, options: ['VIP Delegate', 'General Attendee', 'Founder / CXO', 'Investor', 'Student'] },
  ]);

  const [selectedFieldId, setSelectedFieldId] = useState<string>('f_experience');

  const [settings, setSettings] = useState({
    capacity: 1200,
    registrationOpenDate: '2026-08-25',
    registrationCloseDate: '2026-10-24',
    autoGenerateQRPass: true,
    showPassAfterRegistration: true,
    allowAttendeeEdit: true,
    enableEmailConfirmation: true,
    enableWhatsAppConfirmation: true,
    enableQRCheckIn: true,
    enableManualSearch: true,
    allowStaffCheckIn: true,
    requireEntranceSelection: true,
    entrances: [
      { id: 'ent-1', name: 'Entrance A (North Gate / VIP)', color: '#4f46e5', checkInCount: 0 },
      { id: 'ent-2', name: 'Entrance B (Main Hall General)', color: '#0284c7', checkInCount: 0 },
      { id: 'ent-3', name: 'Entrance C (East Wing)', color: '#059669', checkInCount: 0 },
    ],
    tags: ['AI', 'SaaS', 'Leadership', 'Venture'],
  });

  const availableFieldTypes: { type: FieldType; label: string; icon: string }[] = [
    { type: 'text', label: 'Text Input', icon: 'Text' },
    { type: 'dropdown', label: 'Dropdown Select', icon: 'List' },
    { type: 'radio', label: 'Radio Choices', icon: 'Radio' },
    { type: 'checkbox', label: 'Checkbox', icon: 'Check' },
    { type: 'textarea', label: 'Paragraph Text', icon: 'Area' },
    { type: 'date', label: 'Date Picker', icon: 'Date' },
    { type: 'number', label: 'Number Input', icon: 'Num' },
    { type: 'file', label: 'File Upload', icon: 'File' },
  ];

  const addCustomField = (type: FieldType, label: string) => {
    const fieldLabel = label || `New ${type} Field`;
    const newField: RegistrationField = {
      id: `f_${Date.now()}`,
      label: fieldLabel,
      type,
      required: false,
      placeholder: `Enter ${(fieldLabel || '').toLowerCase()}...`,
      options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    addToast({ type: 'info', title: 'Field Added', description: `Added "${newField.label}" to registration form.` });
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(fields[0]?.id || '');
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handlePublish = () => {
    const newEvt = createEvent({
      name: basicDetails.name,
      description: basicDetails.description,
      category: basicDetails.category,
      date: basicDetails.date,
      startTime: basicDetails.startTime,
      endTime: basicDetails.endTime,
      venueName: basicDetails.venueName,
      venueAddress: basicDetails.venueAddress,
      city: basicDetails.city,
      organizerName: basicDetails.organizerName,
      organizerContact: basicDetails.organizerContact,
      organizerEmail: basicDetails.organizerEmail,
      website: basicDetails.website,
      branding,
      fields,
      settings,
      status: 'published',
    });

    publishEvent(newEvt.id);
    setCreatedEvent(newEvt);
    setPublishedModalOpen(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (e) {}
  };

  const steps = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Branding' },
    { num: 3, label: 'Form Builder' },
    { num: 4, label: 'Settings' },
    { num: 5, label: 'Review & Publish' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Wizard Header */}
      <PageHeader
        title="Create New Event"
        subtitle="Configure event metadata, customize registration fields, and publish your digital passes."
        breadcrumbs={[
          { label: 'Events', onClick: () => navigateTo('/app/events') },
          { label: 'New Event Wizard' },
        ]}
      />

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setCurrentStep(s.num)}
                className="flex items-center gap-2.5 text-xs font-semibold group focus:outline-none"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.num
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                      : currentStep > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline ${
                    currentStep === s.num ? 'text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  {s.label}
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Details */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Event Overview & Location
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name *</label>
              <input
                type="text"
                value={basicDetails.name}
                onChange={(e) => setBasicDetails({ ...basicDetails, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Business Summit 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={basicDetails.category}
                  onChange={(e) => setBasicDetails({ ...basicDetails, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                >
                  <option value="Conference & Summit">Conference & Summit</option>
                  <option value="Trade Fair & Expo">Trade Fair & Expo</option>
                  <option value="Networking Meetup">Networking Meetup</option>
                  <option value="Workshop & Bootcamp">Workshop & Bootcamp</option>
                  <option value="Awards & Gala">Awards & Gala</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={basicDetails.city}
                  onChange={(e) => setBasicDetails({ ...basicDetails, city: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Madurai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={basicDetails.description}
                onChange={(e) => setBasicDetails({ ...basicDetails, description: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Describe your keynote sessions, target audience, and highlights..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date</label>
                <input
                  type="date"
                  value={basicDetails.date}
                  onChange={(e) => setBasicDetails({ ...basicDetails, date: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="text"
                  value={basicDetails.startTime}
                  onChange={(e) => setBasicDetails({ ...basicDetails, startTime: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="09:00 AM"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="text"
                  value={basicDetails.endTime}
                  onChange={(e) => setBasicDetails({ ...basicDetails, endTime: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="05:30 PM"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Hall Name</label>
                <input
                  type="text"
                  value={basicDetails.venueName}
                  onChange={(e) => setBasicDetails({ ...basicDetails, venueName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Convention Centre"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Address</label>
                <input
                  type="text"
                  value={basicDetails.venueAddress}
                  onChange={(e) => setBasicDetails({ ...basicDetails, venueAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Street / Landmark"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                <span className="text-xs text-indigo-600 font-semibold">Public Card</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="h-28 bg-slate-800">
                  <img src={branding.coverImageUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{basicDetails.name || 'Untitled Event'}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{basicDetails.date} • {basicDetails.city}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{basicDetails.venueName || 'Venue'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setCurrentStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Branding
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Branding */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              2. Branding & Visual Identity
            </h3>

            {/* Brand Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Event Primary Brand Color</label>
              <div className="flex items-center gap-3">
                {['#4f46e5', '#0284c7', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0f172a'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBranding({ ...branding, primaryColor: color })}
                    className={`w-9 h-9 rounded-xl transition-transform flex items-center justify-center text-white ${
                      branding.primaryColor === color ? 'scale-110 ring-4 ring-slate-200 shadow-xs' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {branding.primaryColor === color && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Cover Image Header</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80',
                ].map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBranding({ ...branding, coverImageUrl: imgUrl })}
                    className={`h-24 rounded-xl overflow-hidden border-2 transition-all relative ${
                      branding.coverImageUrl === imgUrl ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover" alt="Cover" />
                    {branding.coverImageUrl === imgUrl && (
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Form Builder
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-4">Pass & Registration Preview</span>
            <div
              className="p-5 rounded-2xl text-white shadow-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Official Pass Preview</p>
              <h4 className="text-lg font-bold mt-1">{basicDetails.name}</h4>
              <p className="text-xs opacity-90 mt-1">{basicDetails.date} • {basicDetails.city}</p>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span>Gate A Access</span>
                <QrCode className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Registration Form Builder (Drag & Drop UI) */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Available Fields Palette (3 cols) */}
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Available Fields
            </h4>
            <div className="space-y-1.5">
              {availableFieldTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addCustomField(item.type, item.label)}
                  className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs font-medium text-slate-700 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 group-hover:text-indigo-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Center: Active Form Builder (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Registration Form Fields ({fields.length})</h4>
              <span className="text-xs text-slate-400">Click field to edit</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {fields.map((f, idx) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedFieldId === f.id
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/10 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{f.type} field</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setFields(
                          fields.map((item) =>
                            item.id === f.id ? { ...item, required: !item.required } : item
                          )
                        );
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        f.required ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {f.required ? 'Required' : 'Optional'}
                    </button>
                    {!f.systemField && (
                      <button
                        type="button"
                        onClick={() => removeField(f.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>Back</Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(4)}>Proceed to Settings</Button>
            </div>
          </div>

          {/* Right: Field Settings Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {selectedField ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                  Field Settings: {selectedField.label}
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields(fields.map((f) => (f.id === selectedField.id ? { ...f, label: val } : f)));
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields(fields.map((f) => (f.id === selectedField.id ? { ...f, placeholder: val } : f)));
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Options List</label>
                    <div className="space-y-1.5">
                      {selectedField.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(selectedField.options || [])];
                              newOpts[i] = e.target.value;
                              setFields(
                                fields.map((f) =>
                                  f.id === selectedField.id ? { ...f, options: newOpts } : f
                                )
                              );
                            }}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 text-xs"
                        onClick={() => {
                          const newOpts = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                          setFields(fields.map((f) => (f.id === selectedField.id ? { ...f, options: newOpts } : f)));
                        }}
                      >
                        + Add Choice Option
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Select a form field to configure its properties.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Registration Settings & Multi-Entrance */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            4. Capacity, Pass Generation & Entrance Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity Limit</label>
              <input
                type="number"
                value={settings.capacity}
                onChange={(e) => setSettings({ ...settings, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Registrations automatically close at limit</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Opens</label>
              <input
                type="date"
                value={settings.registrationOpenDate}
                onChange={(e) => setSettings({ ...settings, registrationOpenDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Closes</label>
              <input
                type="date"
                value={settings.registrationCloseDate}
                onChange={(e) => setSettings({ ...settings, registrationCloseDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Automation & Messaging Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900">Auto-Generate Digital QR Pass</p>
                  <p className="text-[11px] text-slate-500">Cryptographically signed token badge</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoGenerateQRPass}
                  onChange={(e) => setSettings({ ...settings, autoGenerateQRPass: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900">WhatsApp QR Pass Delivery</p>
                  <p className="text-[11px] text-slate-500">Instant ticket sent to mobile number</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableWhatsAppConfirmation}
                  onChange={(e) => setSettings({ ...settings, enableWhatsAppConfirmation: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900">Enable Mobile QR Scanner</p>
                  <p className="text-[11px] text-slate-500">High-speed check-in at entrance gates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableQRCheckIn}
                  onChange={(e) => setSettings({ ...settings, enableQRCheckIn: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-900">Enable Manual Attendee Search</p>
                  <p className="text-[11px] text-slate-500">Search by Name, Phone, or Reg ID</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableManualSearch}
                  onChange={(e) => setSettings({ ...settings, enableManualSearch: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>Back</Button>
            <Button variant="primary" size="md" onClick={() => setCurrentStep(5)}>Proceed to Review</Button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Publish */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">5. Review Event Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Confirm details before taking the registration link live</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              Ready to Publish
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Event Information</h4>
              <p><strong>Name:</strong> {basicDetails.name}</p>
              <p><strong>Category:</strong> {basicDetails.category}</p>
              <p><strong>Date & Time:</strong> {basicDetails.date} ({basicDetails.startTime} - {basicDetails.endTime})</p>
              <p><strong>Venue:</strong> {basicDetails.venueName}, {basicDetails.city}</p>
              <p><strong>Capacity Limit:</strong> {settings.capacity.toLocaleString()} seats</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Registration Fields & Gates</h4>
              <p><strong>Total Form Fields:</strong> {fields.length} questions</p>
              <p><strong>QR Pass Generation:</strong> Enabled (Instant QR Ticket)</p>
              <p><strong>Active Gates:</strong> {settings.entrances.map((e) => e.name).join(', ')}</p>
              <p><strong>WhatsApp Notifications:</strong> Enabled</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)}>Back</Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  createEvent({ ...basicDetails, status: 'draft', branding, fields, settings });
                  navigateTo('/app/events');
                }}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePublish}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="shadow-md"
              >
                Publish Event & Launch Live Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Published Success Modal */}
      <Modal
        isOpen={publishedModalOpen}
        onClose={() => {
          setPublishedModalOpen(false);
          navigateTo(createdEvent ? `/app/events/${createdEvent.id}` : '/app/events');
        }}
        maxWidth="lg"
        showCloseButton={true}
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900">Your event is live</h3>
            <p className="text-xs text-slate-500 mt-1">{createdEvent?.name || basicDetails.name}</p>
          </div>

          {/* Registration URL Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Public Registration URL</p>
            <div className="flex items-center justify-between gap-2 mt-1 font-mono text-xs text-indigo-700 bg-white p-2 rounded-lg border border-slate-200">
              <span className="truncate">{window.location.origin}/e/{createdEvent?.slug || 'event-slug'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/e/${createdEvent?.slug || 'event-slug'}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (createdEvent) navigateTo(`/e/${createdEvent.slug}`);
              }}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Registration
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (createdEvent) navigateTo(`/app/events/${createdEvent.id}`);
              }}
            >
              Go to Event Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
