export type UserRole = 'platform_admin' | 'organizer' | 'staff';

export type EventStatus = 
  | 'draft' 
  | 'published' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'live' 
  | 'completed' 
  | 'archived';

export type AttendeeStatus = 
  | 'registered' 
  | 'checked_in' 
  | 'cancelled' 
  | 'waitlisted' 
  | 'walk_in';

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'dropdown' 
  | 'radio' 
  | 'checkbox' 
  | 'textarea' 
  | 'date'
  | 'file';

export interface RegistrationField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For dropdown, radio
  systemField?: boolean; // Name, Email, Phone are built-in
  helpText?: string;
}

export interface EntranceConfig {
  id: string;
  name: string; // e.g. 'Entrance A (Main Hall)', 'Entrance B', 'VIP Lounge'
  color?: string;
  checkInCount: number;
}

export interface EventBranding {
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  organizerLogoUrl?: string;
  theme: 'light' | 'dark' | 'glass';
}

export interface EventSettings {
  capacity: number;
  registrationOpenDate: string;
  registrationCloseDate: string;
  autoGenerateQRPass: boolean;
  showPassAfterRegistration: boolean;
  allowAttendeeEdit: boolean;
  enableEmailConfirmation: boolean;
  enableWhatsAppConfirmation: boolean;
  enableQRCheckIn: boolean;
  enableManualSearch: boolean;
  allowStaffCheckIn: boolean;
  requireEntranceSelection: boolean;
  entrances: EntranceConfig[];
  tags: string[];
}

export interface EventItem {
  id: string;
  slug: string;
  organizationId: string;
  organizationName: string;
  name: string;
  description: string;
  category: string;
  date: string; // e.g. "2026-09-15"
  startTime: string; // "09:00 AM"
  endTime: string; // "05:30 PM"
  venueName: string;
  venueAddress: string;
  city: string;
  organizerName: string;
  organizerContact: string;
  organizerEmail: string;
  website?: string;
  status: EventStatus;
  branding: EventBranding;
  fields: RegistrationField[];
  settings: EventSettings;
  createdAt: string;
  updatedAt: string;
  // Computed / cached stats
  stats: {
    totalRegistrations: number;
    totalCheckedIn: number;
    totalCancelled: number;
    totalWalkIns: number;
    capacity: number;
    attendancePercentage: number;
  };
}

export interface Attendee {
  id: string; // Internal UUID
  registrationId: string; // e.g. "EVT26-000123"
  eventId: string;
  eventName: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  jobTitle?: string;
  city?: string;
  customAnswers?: Record<string, string | string[]>;
  status: AttendeeStatus;
  registeredAt: string; // ISO string or format
  qrToken: string; // Secure token representation
  checkedInAt?: string;
  checkedInBy?: string; // Staff name
  checkedInEntrance?: string; // Entrance A, etc.
  checkedInDevice?: string;
  avatarUrl?: string;
  notes?: string;
  ticketType?: string; // 'General Attendee', 'VIP Delegate', 'Speaker', 'Sponsor'
}

export interface CheckInLog {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  registrationId: string;
  company?: string;
  timestamp: string; // "10:41:32 AM"
  fullDateTime: string;
  entrance: string;
  staffName: string;
  staffId: string;
  device: string;
  type: 'qr_scan' | 'manual_search' | 'walk_in';
}

export interface StaffMember {
  id: string;
  organizationId?: string;
  eventId?: string;
  assignedEventId?: string;
  name: string;
  email: string;
  phone: string;
  role: 'event_manager' | 'check_in_staff' | 'viewer' | 'gate_lead' | 'scanner' | 'receptionist' | string;
  assignedEntrance?: string;
  assignedGate?: string;
  status: 'active' | 'inactive';
  lastActive?: string;
  checkInCount: number;
  avatarUrl?: string;
  loginToken?: string;
}

export interface MessageCampaign {
  id: string;
  eventId: string;
  title: string;
  type?: 'registration_confirmation' | 'qr_pass_delivery' | 'event_reminder' | 'event_day_alert' | 'thank_you' | string;
  channel: 'whatsapp' | 'email' | 'both';
  audience?: 'all_registered' | 'checked_in_only' | 'not_checked_in' | 'vip_only' | string;
  targetAudience?: 'all' | 'checked_in' | 'not_checked_in' | 'vip_only' | string;
  messageTemplate?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'ready';
  scheduledFor?: string;
  sentAt?: string;
  recipientCount?: number;
  deliveryRate?: number;
  templatePreview?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'free' | 'starter' | 'growth' | 'business';
  ownerName: string;
  ownerEmail: string;
  phone: string;
  website?: string;
  city: string;
  timezone: string;
  currency: string;
  defaultBrandColor: string;
  activeEventsCount: number;
  totalRegistrationsCount: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limitText?: string;
}

export interface PricingPlan {
  id: 'free' | 'starter' | 'growth' | 'business';
  name: string;
  tagline: string;
  monthlyPrice: number; // in INR ₹
  annualPrice: number;
  eventsAllowed: number | 'Unlimited';
  registrationLimit: number | 'Unlimited';
  staffSeats: number | 'Unlimited';
  whatsappMessages: number;
  customBranding: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  popular?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'capacity' | 'registration' | 'checkin' | 'system' | 'staff';
  eventId?: string;
}

export interface ScanResultState {
  type: 'idle' | 'success' | 'duplicate' | 'invalid' | 'cancelled' | 'wrong_event';
  success?: boolean;
  attendee?: Attendee;
  message?: string;
  checkInTime?: string;
  entrance?: string;
  staffName?: string;
  previousCheckInTime?: string;
  previousEntrance?: string;
  scannedToken?: string;
}
