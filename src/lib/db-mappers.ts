import {
  Organization,
  EventItem,
  Attendee,
  StaffMember,
  CheckInLog,
  MessageCampaign,
  NotificationItem,
} from '../types';

export const mapDbToOrganization = (row: any): Organization => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logoUrl: row.logo_url,
  plan: row.plan || 'growth',
  ownerName: row.owner_name,
  ownerEmail: row.owner_email,
  phone: row.phone || '',
  website: row.website,
  city: row.city || '',
  timezone: row.timezone || 'Asia/Kolkata (IST)',
  currency: row.currency || 'INR (₹)',
  defaultBrandColor: row.default_brand_color || '#4f46e5',
  activeEventsCount: row.active_events_count || 0,
  totalRegistrationsCount: row.total_registrations_count || 0,
  status: row.status || 'active',
  createdAt: row.created_at,
});

export const mapOrganizationToDb = (org: Partial<Organization>) => {
  const row: Record<string, any> = {};
  if (org.id !== undefined) row.id = org.id;
  if (org.name !== undefined) row.name = org.name;
  if (org.slug !== undefined) row.slug = org.slug;
  if (org.logoUrl !== undefined) row.logo_url = org.logoUrl;
  if (org.plan !== undefined) row.plan = org.plan;
  if (org.ownerName !== undefined) row.owner_name = org.ownerName;
  if (org.ownerEmail !== undefined) row.owner_email = org.ownerEmail;
  if (org.phone !== undefined) row.phone = org.phone;
  if (org.website !== undefined) row.website = org.website;
  if (org.city !== undefined) row.city = org.city;
  if (org.timezone !== undefined) row.timezone = org.timezone;
  if (org.currency !== undefined) row.currency = org.currency;
  if (org.defaultBrandColor !== undefined) row.default_brand_color = org.defaultBrandColor;
  if (org.status !== undefined) row.status = org.status;
  return row;
};

export const mapDbToEvent = (row: any): EventItem => ({
  id: row.id,
  slug: row.slug,
  organizationId: row.organization_id,
  organizationName: row.organization_name || '',
  name: row.name,
  description: row.description || '',
  category: row.category || 'Conference',
  date: row.date,
  startTime: row.start_time || '09:00 AM',
  endTime: row.end_time || '05:00 PM',
  venueName: row.venue_name || '',
  venueAddress: row.venue_address || '',
  city: row.city || '',
  organizerName: row.organizer_name || '',
  organizerContact: row.organizer_contact || '',
  organizerEmail: row.organizer_email || '',
  website: row.website,
  status: row.status || 'published',
  branding: row.branding || { primaryColor: '#4f46e5', theme: 'light' },
  fields: row.fields || [],
  settings: row.settings || { capacity: 500, tags: ['Business'] },
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || new Date().toISOString(),
  stats: {
    totalRegistrations: 0,
    totalCheckedIn: 0,
    totalCancelled: 0,
    totalWalkIns: 0,
    capacity: row.settings?.capacity || 500,
    attendancePercentage: 0,
  },
});

export const mapEventToDb = (evt: Partial<EventItem>) => {
  const row: Record<string, any> = {};
  if (evt.id !== undefined) row.id = evt.id;
  if (evt.slug !== undefined) row.slug = evt.slug;
  if (evt.organizationId !== undefined) row.organization_id = evt.organizationId;
  if (evt.organizationName !== undefined) row.organization_name = evt.organizationName;
  if (evt.name !== undefined) row.name = evt.name;
  if (evt.description !== undefined) row.description = evt.description;
  if (evt.category !== undefined) row.category = evt.category;
  if (evt.date !== undefined) row.date = evt.date;
  if (evt.startTime !== undefined) row.start_time = evt.startTime;
  if (evt.endTime !== undefined) row.end_time = evt.endTime;
  if (evt.venueName !== undefined) row.venue_name = evt.venueName;
  if (evt.venueAddress !== undefined) row.venue_address = evt.venueAddress;
  if (evt.city !== undefined) row.city = evt.city;
  if (evt.organizerName !== undefined) row.organizer_name = evt.organizerName;
  if (evt.organizerContact !== undefined) row.organizer_contact = evt.organizerContact;
  if (evt.organizerEmail !== undefined) row.organizer_email = evt.organizerEmail;
  if (evt.website !== undefined) row.website = evt.website;
  if (evt.status !== undefined) row.status = evt.status;
  if (evt.branding !== undefined) row.branding = evt.branding;
  if (evt.fields !== undefined) row.fields = evt.fields;
  if (evt.settings !== undefined) row.settings = evt.settings;
  row.updated_at = new Date().toISOString();
  return row;
};

export const mapDbToAttendee = (row: any): Attendee => ({
  id: row.id,
  registrationId: row.registration_id,
  eventId: row.event_id,
  eventName: row.event_name || '',
  fullName: row.full_name,
  email: row.email,
  phone: row.phone || '',
  company: row.company,
  jobTitle: row.job_title,
  city: row.city,
  ticketType: row.ticket_type || 'General Attendee',
  status: row.status || 'registered',
  registeredAt: row.registered_at || row.created_at || new Date().toISOString(),
  qrToken: row.qr_token,
  checkedInAt: row.checked_in_at,
  checkedInBy: row.checked_in_by,
  checkedInEntrance: row.checked_in_entrance,
  checkedInDevice: row.checked_in_device,
  avatarUrl: row.avatar_url,
  notes: row.notes,
  customAnswers: row.custom_answers || {},
});

export const mapAttendeeToDb = (att: Partial<Attendee>) => {
  const row: Record<string, any> = {};
  if (att.id !== undefined) row.id = att.id;
  if (att.registrationId !== undefined) row.registration_id = att.registrationId;
  if (att.eventId !== undefined) row.event_id = att.eventId;
  if (att.eventName !== undefined) row.event_name = att.eventName;
  if (att.fullName !== undefined) row.full_name = att.fullName;
  if (att.email !== undefined) row.email = att.email;
  if (att.phone !== undefined) row.phone = att.phone;
  if (att.company !== undefined) row.company = att.company;
  if (att.jobTitle !== undefined) row.job_title = att.jobTitle;
  if (att.city !== undefined) row.city = att.city;
  if (att.ticketType !== undefined) row.ticket_type = att.ticketType;
  if (att.status !== undefined) row.status = att.status;
  if (att.qrToken !== undefined) row.qr_token = att.qrToken;
  if (att.checkedInAt !== undefined) row.checked_in_at = att.checkedInAt;
  if (att.checkedInBy !== undefined) row.checked_in_by = att.checkedInBy;
  if (att.checkedInEntrance !== undefined) row.checked_in_entrance = att.checkedInEntrance;
  if (att.checkedInDevice !== undefined) row.checked_in_device = att.checkedInDevice;
  if (att.avatarUrl !== undefined) row.avatar_url = att.avatarUrl;
  if (att.notes !== undefined) row.notes = att.notes;
  if (att.customAnswers !== undefined) row.custom_answers = att.customAnswers;
  return row;
};

export const mapDbToCheckInLog = (row: any): CheckInLog => ({
  id: row.id,
  eventId: row.event_id,
  attendeeId: row.attendee_id,
  attendeeName: row.attendee_name,
  registrationId: row.registration_id,
  company: row.company,
  timestamp: row.timestamp,
  fullDateTime: row.full_date_time || row.created_at || new Date().toISOString(),
  entrance: row.entrance || 'Main Entrance',
  staffName: row.staff_name || 'Staff',
  staffId: row.staff_id || 'staff-01',
  device: row.device || 'Scanner',
  type: row.type || 'qr_scan',
});

export const mapCheckInLogToDb = (log: Partial<CheckInLog>) => {
  const row: Record<string, any> = {};
  if (log.id !== undefined) row.id = log.id;
  if (log.eventId !== undefined) row.event_id = log.eventId;
  if (log.attendeeId !== undefined) row.attendee_id = log.attendeeId;
  if (log.attendeeName !== undefined) row.attendee_name = log.attendeeName;
  if (log.registrationId !== undefined) row.registration_id = log.registrationId;
  if (log.company !== undefined) row.company = log.company;
  if (log.timestamp !== undefined) row.timestamp = log.timestamp;
  if (log.fullDateTime !== undefined) row.full_date_time = log.fullDateTime;
  if (log.entrance !== undefined) row.entrance = log.entrance;
  if (log.staffName !== undefined) row.staff_name = log.staffName;
  if (log.staffId !== undefined) row.staff_id = log.staffId;
  if (log.device !== undefined) row.device = log.device;
  if (log.type !== undefined) row.type = log.type;
  return row;
};

export const mapDbToStaff = (row: any): StaffMember => ({
  id: row.id,
  organizationId: row.organization_id,
  eventId: row.event_id,
  assignedEventId: row.assigned_event_id,
  name: row.name,
  email: row.email,
  phone: row.phone || '',
  role: row.role || 'scanner',
  assignedEntrance: row.assigned_entrance,
  assignedGate: row.assigned_gate,
  status: row.status || 'active',
  lastActive: row.last_active || 'Just now',
  checkInCount: row.check_in_count || 0,
  avatarUrl: row.avatar_url,
  loginToken: row.login_token,
});

export const mapStaffToDb = (s: Partial<StaffMember>) => {
  const row: Record<string, any> = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.organizationId !== undefined) row.organization_id = s.organizationId;
  if (s.eventId !== undefined) row.event_id = s.eventId;
  if (s.assignedEventId !== undefined) row.assigned_event_id = s.assignedEventId;
  if (s.name !== undefined) row.name = s.name;
  if (s.email !== undefined) row.email = s.email;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.role !== undefined) row.role = s.role;
  if (s.assignedEntrance !== undefined) row.assigned_entrance = s.assignedEntrance;
  if (s.assignedGate !== undefined) row.assigned_gate = s.assignedGate;
  if (s.status !== undefined) row.status = s.status;
  if (s.lastActive !== undefined) row.last_active = s.lastActive;
  if (s.checkInCount !== undefined) row.check_in_count = s.checkInCount;
  if (s.avatarUrl !== undefined) row.avatar_url = s.avatarUrl;
  if (s.loginToken !== undefined) row.login_token = s.loginToken;
  return row;
};

export const mapDbToCampaign = (row: any): MessageCampaign => ({
  id: row.id,
  eventId: row.event_id,
  title: row.title,
  type: row.type,
  channel: row.channel || 'both',
  audience: row.audience,
  targetAudience: row.target_audience || 'all',
  messageTemplate: row.message_template,
  status: row.status || 'ready',
  scheduledFor: row.scheduled_for,
  sentAt: row.sent_at,
  recipientCount: row.recipient_count || 0,
  deliveryRate: Number(row.delivery_rate) || 0,
  templatePreview: row.template_preview,
});

export const mapCampaignToDb = (c: Partial<MessageCampaign>) => {
  const row: Record<string, any> = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.eventId !== undefined) row.event_id = c.eventId;
  if (c.title !== undefined) row.title = c.title;
  if (c.type !== undefined) row.type = c.type;
  if (c.channel !== undefined) row.channel = c.channel;
  if (c.audience !== undefined) row.audience = c.audience;
  if (c.targetAudience !== undefined) row.target_audience = c.targetAudience;
  if (c.messageTemplate !== undefined) row.message_template = c.messageTemplate;
  if (c.status !== undefined) row.status = c.status;
  if (c.scheduledFor !== undefined) row.scheduled_for = c.scheduledFor;
  if (c.sentAt !== undefined) row.sent_at = c.sentAt;
  if (c.recipientCount !== undefined) row.recipient_count = c.recipientCount;
  if (c.deliveryRate !== undefined) row.delivery_rate = c.deliveryRate;
  if (c.templatePreview !== undefined) row.template_preview = c.templatePreview;
  return row;
};

export const mapDbToNotification = (row: any): NotificationItem => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  timestamp: row.timestamp || 'Just now',
  read: Boolean(row.read),
  type: row.type || 'system',
  eventId: row.event_id,
});
