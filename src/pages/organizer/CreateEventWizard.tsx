import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
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
  Type,
  List,
  CheckSquare,
  AlignLeft,
  Hash,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { RegistrationField, FieldType, EventItem } from '@/types';
import confetti from 'canvas-confetti';

// Dynamic date & time helpers
const getTodayFormatted = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCurrentTimeFormatted = (offsetHours = 0): string => {
  const now = new Date();
  now.setHours(now.getHours() + offsetHours);
  let hours = now.getHours();
  let minutes = Math.ceil(now.getMinutes() / 15) * 15;
  if (minutes >= 60) {
    hours += 1;
    minutes = 0;
  }
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const strHours = String(hours).padStart(2, '0');
  const strMins = String(minutes).padStart(2, '0');
  return `${strHours}:${strMins} ${period}`;
};

export const CreateEventWizard: React.FC = () => {
  const { currentOrg, createEvent, publishEvent, navigateTo, addToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [publishedModalOpen, setPublishedModalOpen] = useState<boolean>(false);
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const initialToday = getTodayFormatted();
  const initialStartTime = getCurrentTimeFormatted(0);
  const initialEndTime = getCurrentTimeFormatted(2);

  // Form State
  const [basicDetails, setBasicDetails] = useState({
    name: 'Madurai AI & SaaS Conclave 2026',
    description: 'South India’s premier conference on generative AI engineering, B2B SaaS scaling, cross-border venture capital, and digital commerce transformation.',
    category: 'Conference & Summit',
    date: initialToday,
    startTime: initialStartTime,
    endTime: initialEndTime,
    venueName: 'Madurai World Trade Centre, Grand Auditorium',
    venueAddress: '100 Feet Ring Road',
    city: 'Madurai',
    organizerName: currentOrg.ownerName,
    organizerContact: currentOrg.phone,
    organizerEmail: currentOrg.ownerEmail,
    website: 'https://conclave2026.in',
  });

  const [branding, setBranding] = useState({
    primaryColor: '#2563eb',
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
    registrationOpenDate: initialToday,
    registrationCloseDate: initialToday,
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
      { id: 'ent-1', name: 'Entrance A (North Gate / VIP)', color: '#2563eb', checkInCount: 0 },
      { id: 'ent-2', name: 'Entrance B (Main Hall General)', color: '#0284c7', checkInCount: 0 },
      { id: 'ent-3', name: 'Entrance C (East Wing)', color: '#059669', checkInCount: 0 },
    ],
    tags: ['AI', 'SaaS', 'Leadership', 'Venture'],
  });

  const availableFieldTypes: { type: FieldType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Text Input', icon: <Type className="w-4 h-4" /> },
    { type: 'dropdown', label: 'Dropdown Select', icon: <List className="w-4 h-4" /> },
    { type: 'radio', label: 'Radio Choices', icon: <CheckCircle2 className="w-4 h-4" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
    { type: 'textarea', label: 'Paragraph Text', icon: <AlignLeft className="w-4 h-4" /> },
    { type: 'date', label: 'Date Picker', icon: <Calendar className="w-4 h-4" /> },
    { type: 'number', label: 'Number Input', icon: <Hash className="w-4 h-4" /> },
    { type: 'file', label: 'File Upload', icon: <Upload className="w-4 h-4" /> },
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

  const handlePublish = async () => {
    const newEvt = await createEvent({
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

    await publishEvent(newEvt.id);
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
      <div className="p-4 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="p-1">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setCurrentStep(s.num)}
                  className="flex items-center gap-2.5 text-xs font-semibold group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === s.num
                        ? 'bg-[#1A1A1A] text-white ring-4 ring-[#C49A3C]/20 shadow-xs'
                        : currentStep > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#F0EDE8] text-[#9A9A9A] group-hover:bg-[#E8E5DF]'
                    }`}
                  >
                    {currentStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline ${
                      currentStep === s.num ? 'text-[#1A1A1A] font-bold' : 'text-[#6B6B6B]'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > s.num ? 'bg-emerald-500' : 'bg-[#E8E5DF]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Basic Details */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 shadow-xs border-slate-200">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. Event Overview & Location
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="event-name">Event Name *</Label>
                <Input
                  id="event-name"
                  type="text"
                  value={basicDetails.name}
                  onChange={(e) => setBasicDetails({ ...basicDetails, name: e.target.value })}
                  placeholder="e.g. Business Summit 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={basicDetails.category}
                    onValueChange={(val) => setBasicDetails({ ...basicDetails, category: val })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conference & Summit">Conference & Summit</SelectItem>
                      <SelectItem value="Trade Fair & Expo">Trade Fair & Expo</SelectItem>
                      <SelectItem value="Networking Meetup">Networking Meetup</SelectItem>
                      <SelectItem value="Workshop & Bootcamp">Workshop & Bootcamp</SelectItem>
                      <SelectItem value="Awards & Gala">Awards & Gala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={basicDetails.city}
                    onChange={(e) => setBasicDetails({ ...basicDetails, city: e.target.value })}
                    placeholder="e.g. Madurai"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={basicDetails.description}
                  onChange={(e) => setBasicDetails({ ...basicDetails, description: e.target.value })}
                  placeholder="Describe your keynote sessions, target audience, and highlights..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <DatePicker
                    id="eventDate"
                    value={basicDetails.date}
                    onChange={(date) => setBasicDetails({ ...basicDetails, date })}
                    placeholder="Select event date"
                    minDate={initialToday}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">Start Time</Label>
                  <TimePicker
                    id="startTime"
                    value={basicDetails.startTime}
                    onChange={(startTime) => setBasicDetails({ ...basicDetails, startTime })}
                    placeholder="09:00 AM"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime">End Time</Label>
                  <TimePicker
                    id="endTime"
                    value={basicDetails.endTime}
                    onChange={(endTime) => setBasicDetails({ ...basicDetails, endTime })}
                    placeholder="05:30 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="venueName">Venue / Hall Name</Label>
                  <Input
                    id="venueName"
                    type="text"
                    value={basicDetails.venueName}
                    onChange={(e) => setBasicDetails({ ...basicDetails, venueName: e.target.value })}
                    placeholder="Convention Centre"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Input
                    id="venueAddress"
                    type="text"
                    value={basicDetails.venueAddress}
                    onChange={(e) => setBasicDetails({ ...basicDetails, venueAddress: e.target.value })}
                    placeholder="Street / Landmark"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Panel */}
          <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
                <span className="text-xs text-blue-600 font-semibold">Public Card</span>
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
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-6">
            <h3 className="text-base font-bold text-[#1A1A1A] border-b border-[#F0EDE8] pb-3">
              2. Branding & Visual Identity
            </h3>

            {/* Brand Color Selection */}
            <div>
              <Label className="mb-2 block text-xs font-semibold text-[#1A1A1A]">Event Primary Brand Color</Label>
              <div className="flex items-center gap-3">
                {['#C49A3C', '#1A1A1A', '#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#475569'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBranding({ ...branding, primaryColor: color })}
                    className={`w-9 h-9 rounded-xl transition-transform flex items-center justify-center text-white cursor-pointer ${
                      branding.primaryColor === color ? 'scale-110 ring-4 ring-[#E8E5DF] shadow-xs' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {branding.primaryColor === color && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image Upload (Base64 + Exact Resolution Label) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1A1A1A]">Event Cover Banner Image</Label>
              <ImageUpload
                value={branding.coverImageUrl}
                onChange={(base64Url) => setBranding({ ...branding, coverImageUrl: base64Url })}
                recommendedResolution="1200 × 630 px"
                aspectRatioLabel="16:9 Landscape"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F0EDE8]">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} className="rounded-xl">
                Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />} className="rounded-xl">
                Proceed to Form Builder
              </Button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#FAFAF7] border border-[#E8E5DF]/70 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-[#9A9A9A] uppercase tracking-wider block">
                Pass & Public Registration Preview
              </span>

              {/* Public Registration Card Preview */}
              <div className="bg-white rounded-2xl border border-[#E8E5DF] overflow-hidden shadow-xs">
                <div className="h-28 bg-[#1A1A1A] relative">
                  {branding.coverImageUrl ? (
                    <img src={branding.coverImageUrl} className="w-full h-full object-cover opacity-90" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9A9A9A] text-xs">
                      No Banner Uploaded
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#1A1A1A]">
                      {basicDetails.category || 'Conference'}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold text-[#1A1A1A] line-clamp-1">{basicDetails.name || 'Untitled Event'}</h4>
                  <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#9A9A9A]" />
                    <span>{basicDetails.date} • {basicDetails.city}</span>
                  </p>
                </div>
              </div>

              {/* Official Pass Preview */}
              <div
                className="p-4 rounded-2xl text-white shadow-sm transition-all"
                style={{ backgroundColor: branding.primaryColor || '#1A1A1A' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">Official Delegate Pass</span>
                  <QrCode className="w-4 h-4 opacity-90" />
                </div>
                <h4 className="text-sm font-bold truncate">{basicDetails.name || 'Event Name'}</h4>
                <p className="text-[11px] opacity-80 mt-0.5">{basicDetails.date} • {basicDetails.city}</p>
                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
                  <span>Universal Gate Access</span>
                  <span className="font-mono font-bold">#PREVIEW</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#9A9A9A] text-center pt-2">
              Banner automatically syncs with public registration URL
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Registration Form Builder */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Available Fields Palette (3 cols) */}
          <Card className="lg:col-span-3 shadow-xs border-slate-200">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Available Fields
              </h4>
              <div className="space-y-1.5">
                {availableFieldTypes.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addCustomField(item.type, item.label)}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-xs font-medium text-slate-700 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 group-hover:text-blue-600">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Center: Active Form Builder (5 cols) */}
          <Card className="lg:col-span-5 shadow-xs border-slate-200">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">Registration Form Fields ({fields.length})</h4>
                <span className="text-xs text-slate-400">Click field to edit</span>
              </div>

              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      selectedFieldId === f.id
                        ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/10 shadow-2xs'
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
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          f.required ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {f.required ? 'Required' : 'Optional'}
                      </button>
                      {!f.systemField && (
                        <button
                          type="button"
                          onClick={() => removeField(f.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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
            </CardContent>
          </Card>

          {/* Right: Field Settings Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {selectedField ? (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                  Field Settings: {selectedField.label}
                </h4>

                <div className="space-y-1.5">
                  <Label>Field Label</Label>
                  <Input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields(fields.map((f) => (f.id === selectedField.id ? { ...f, label: val } : f)));
                    }}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Placeholder Text</Label>
                  <Input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields(fields.map((f) => (f.id === selectedField.id ? { ...f, placeholder: val } : f)));
                    }}
                    className="bg-white"
                  />
                </div>

                {(selectedField.type === 'dropdown' || selectedField.type === 'radio') && (
                  <div className="space-y-1.5">
                    <Label>Options List</Label>
                    <div className="space-y-1.5">
                      {selectedField.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
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
                            className="bg-white h-8 text-xs"
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
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              4. Capacity, Pass Generation & Entrance Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Max Capacity Limit</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={settings.capacity}
                  onChange={(e) => setSettings({ ...settings, capacity: parseInt(e.target.value) || 0 })}
                  className="font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Registrations automatically close at limit</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regOpen">Registration Opens</Label>
                <DatePicker
                  id="regOpen"
                  value={settings.registrationOpenDate}
                  onChange={(date) => setSettings({ ...settings, registrationOpenDate: date })}
                  placeholder="Select open date"
                  minDate={initialToday}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regClose">Registration Closes</Label>
                <DatePicker
                  id="regClose"
                  value={settings.registrationCloseDate}
                  onChange={(date) => setSettings({ ...settings, registrationCloseDate: date })}
                  placeholder="Select close date"
                  minDate={settings.registrationOpenDate || initialToday}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Automation & Messaging Rules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Generate Digital QR Pass</p>
                    <p className="text-[11px] text-slate-500">Cryptographically signed token badge</p>
                  </div>
                  <Switch
                    checked={settings.autoGenerateQRPass}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoGenerateQRPass: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">WhatsApp QR Pass Delivery</p>
                    <p className="text-[11px] text-slate-500">Instant ticket sent to mobile number</p>
                  </div>
                  <Switch
                    checked={settings.enableWhatsAppConfirmation}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableWhatsAppConfirmation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enable Mobile QR Scanner</p>
                    <p className="text-[11px] text-slate-500">High-speed check-in at entrance gates</p>
                  </div>
                  <Switch
                    checked={settings.enableQRCheckIn}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableQRCheckIn: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enable Manual Attendee Search</p>
                    <p className="text-[11px] text-slate-500">Search by Name, Phone, or Reg ID</p>
                  </div>
                  <Switch
                    checked={settings.enableManualSearch}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableManualSearch: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>Back</Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(5)}>Proceed to Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Publish */}
      {currentStep === 5 && (
        <Card className="shadow-xs border-slate-200">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">5. Review Event Summary</h3>
                <p className="text-xs text-slate-500 mt-0.5">Confirm details before taking the registration link live</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
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
                  onClick={async () => {
                    await createEvent({ ...basicDetails, status: 'draft', branding, fields, settings });
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
          </CardContent>
        </Card>
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
            <div className="flex items-center justify-between gap-2 mt-1 font-mono text-xs text-blue-700 bg-white p-2 rounded-lg border border-slate-200">
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
