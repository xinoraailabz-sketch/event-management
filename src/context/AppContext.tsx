import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Organization,
  EventItem,
  Attendee,
  StaffMember,
  CheckInLog,
  MessageCampaign,
  UserRole,
  NotificationItem,
  ScanResultState,
} from '../types';
import { mockOrganizations } from '../mockData/organizations';
import { mockEvents } from '../mockData/events';
import { getFullAttendeeDataset } from '../mockData/attendees';
import { mockStaff, mockCheckInLogs, mockCampaigns } from '../mockData/staff';
import { generateRegId, playScanSound } from '../lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface AppContextType {
  // Routing
  currentPath: string;
  navigateTo: (path: string) => void;

  // Multi-tenancy & User State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentOrg: Organization;
  organizations: Organization[];
  switchOrg: (orgId: string) => void;
  setCurrentOrgId?: (orgId: string) => void;
  updateOrganization: (updates: Partial<Organization>) => void;

  // Events
  events: EventItem[];
  activeEventId: string;
  activeEvent: EventItem | undefined;
  setActiveEventId: (eventId: string) => void;
  createEvent: (eventData: Partial<EventItem>) => EventItem;
  updateEvent: (eventId: string, updates: Partial<EventItem>) => void;
  deleteEvent: (eventId: string) => void;
  publishEvent: (eventId: string) => void;

  // Attendees
  attendees: Attendee[];
  eventAttendees: Attendee[];
  registerAttendee: (eventId: string, attendeeData: Partial<Attendee>) => Attendee;
  updateAttendee: (attendeeId: string, updates: Partial<Attendee>) => void;
  cancelAttendee: (attendeeId: string) => void;
  checkInAttendee: (attendeeId: string, entrance?: string, staffName?: string) => void;
  undoCheckIn: (attendeeId: string) => void;
  getAttendeeById: (attendeeId: string) => Attendee | undefined;
  getAttendeeByRegId: (regId: string) => Attendee | undefined;

  // Check-In Engine
  checkInLogs: CheckInLog[];
  processCheckIn: (
    identifierOrToken: string,
    entrance?: string,
    staffName?: string,
    device?: string
  ) => ScanResultState;

  // Staff
  staffList: StaffMember[];
  staff: StaffMember[];
  eventStaff: StaffMember[];
  currentStaff: StaffMember | undefined;
  addStaff: (data: Omit<StaffMember, 'id' | 'checkInCount' | 'lastActive'>) => StaffMember;
  addStaffMember: (data: any) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;

  // Campaigns
  campaigns: MessageCampaign[];
  eventCampaigns: MessageCampaign[];
  createCampaign: (data: Omit<MessageCampaign, 'id' | 'deliveryRate'>) => MessageCampaign;
  addCampaign: (data: any) => MessageCampaign;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Quick Global Search
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;

  // Selected entrance for staff / scanner
  selectedEntrance: string;
  setSelectedEntrance: (entrance: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Basic Hash/Path Router with fallback
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const pathname = window.location.pathname;
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (hash) return hash;
    return pathname && pathname !== '/' ? pathname : '/app';
  });

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/app');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Multi-tenant & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('organizer');
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org_abc_events');

  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];

  const switchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    // Find first event in org
    const orgEvent = events.find((e) => e.organizationId === orgId);
    if (orgEvent) {
      setActiveEventId(orgEvent.id);
    }
    addToast({
      type: 'info',
      title: 'Switched Workspace',
      description: `Active organization changed to ${organizations.find((o) => o.id === orgId)?.name}`,
    });
  };

  // Events State
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [activeEventId, setActiveEventId] = useState<string>('evt-business-summit-2026');

  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  // Attendees State
  const [attendees, setAttendees] = useState<Attendee[]>(() => getFullAttendeeDataset());

  // Staff & Logs
  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff);
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>(mockCheckInLogs);
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>(mockCampaigns);

  // Selected Entrance for Check-in / Scanner
  const [selectedEntrance, setSelectedEntrance] = useState<string>('Entrance A (North Gate / VIP)');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Business Summit Reached 83% Capacity',
      description: '1,248 of 1,500 tickets registered. 252 seats remaining.',
      timestamp: '10 mins ago',
      read: false,
      type: 'capacity',
      eventId: 'evt-business-summit-2026',
    },
    {
      id: 'notif-2',
      title: 'Morning Check-in Velocity Spike',
      description: 'Over 280 attendees checked in during the last 30 minutes at Gate A & B.',
      timestamp: '25 mins ago',
      read: false,
      type: 'checkin',
      eventId: 'evt-business-summit-2026',
    },
    {
      id: 'notif-3',
      title: 'Staff Member Rahul Online',
      description: 'Rahul Sundar logged into Scanner #1 - iPad Pro Gate A.',
      timestamp: '1 hour ago',
      read: true,
      type: 'staff',
      eventId: 'evt-business-summit-2026',
    },
  ]);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [newToast, ...prev]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard shortcut for Cmd+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered views
  const safeAttendees = attendees || [];
  const safeStaff = staffList || [];
  const safeCampaigns = campaigns || [];
  const safeEvents = events || [];

  const eventAttendees = safeAttendees.filter((a) => a.eventId === activeEventId);
  const eventStaff = safeStaff.filter((s) => s.eventId === activeEventId || s.assignedEventId === activeEventId);
  const eventCampaigns = safeCampaigns.filter((c) => c.eventId === activeEventId);
  const currentStaff = safeStaff[0];

  // Sync event stats whenever attendees/checkins change
  useEffect(() => {
    setEvents((prevEvents) =>
      (prevEvents || []).map((evt) => {
        const evAtts = (attendees || []).filter((a) => a.eventId === evt.id);
        const registered = evAtts.filter((a) => a.status === 'registered').length;
        const checkedIn = evAtts.filter((a) => a.status === 'checked_in' || a.status === 'walk_in').length;
        const cancelled = evAtts.filter((a) => a.status === 'cancelled').length;
        const walkIns = evAtts.filter((a) => a.status === 'walk_in').length;
        const totalRegs = evAtts.filter((a) => a.status !== 'cancelled').length;
        const pct = evt.settings.capacity > 0 ? (checkedIn / (totalRegs || 1)) * 100 : 0;

        return {
          ...evt,
          stats: {
            totalRegistrations: totalRegs,
            totalCheckedIn: checkedIn,
            totalCancelled: cancelled,
            totalWalkIns: walkIns,
            capacity: evt.settings.capacity,
            attendancePercentage: Math.round(pct * 10) / 10,
          },
        };
      })
    );
  }, [attendees]);

  // Event actions
  const createEvent = (eventData: Partial<EventItem>): EventItem => {
    const rawName = eventData?.name || 'new-event';
    const slug = (rawName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `evt-${slug || 'event'}-${Date.now().toString().slice(-4)}`;

    const newEvent: EventItem = {
      id,
      slug,
      organizationId: currentOrg.id,
      organizationName: currentOrg.name,
      name: eventData.name || 'Untitled Event',
      description: eventData.description || '',
      category: eventData.category || 'Conference',
      date: eventData.date || new Date().toISOString().split('T')[0],
      startTime: eventData.startTime || '09:00 AM',
      endTime: eventData.endTime || '05:00 PM',
      venueName: eventData.venueName || 'Convention Hall',
      venueAddress: eventData.venueAddress || '',
      city: eventData.city || currentOrg.city,
      organizerName: eventData.organizerName || currentOrg.ownerName,
      organizerContact: eventData.organizerContact || currentOrg.phone,
      organizerEmail: eventData.organizerEmail || currentOrg.ownerEmail,
      website: eventData.website,
      status: (eventData.status as any) || 'draft',
      branding: eventData.branding || {
        primaryColor: currentOrg.defaultBrandColor,
        theme: 'light',
      },
      fields: eventData.fields || [
        { id: 'f_name', label: 'Full Name', type: 'text', required: true, systemField: true },
        { id: 'f_email', label: 'Work Email', type: 'email', required: true, systemField: true },
        { id: 'f_phone', label: 'Mobile Number', type: 'phone', required: true, systemField: true },
      ],
      settings: eventData.settings || {
        capacity: 500,
        registrationOpenDate: new Date().toISOString().split('T')[0],
        registrationCloseDate: eventData.date || new Date().toISOString().split('T')[0],
        autoGenerateQRPass: true,
        showPassAfterRegistration: true,
        allowAttendeeEdit: true,
        enableEmailConfirmation: true,
        enableWhatsAppConfirmation: true,
        enableQRCheckIn: true,
        enableManualSearch: true,
        allowStaffCheckIn: true,
        requireEntranceSelection: true,
        entrances: [{ id: 'ent-1', name: 'Main Entrance', color: '#4f46e5', checkInCount: 0 }],
        tags: ['Business'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalRegistrations: 0,
        totalCheckedIn: 0,
        totalCancelled: 0,
        totalWalkIns: 0,
        capacity: eventData.settings?.capacity || 500,
        attendancePercentage: 0,
      },
    };

    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    addToast({
      type: 'success',
      title: 'Event Created',
      description: `"${newEvent.name}" draft is ready to configure.`,
    });
    return newEvent;
  };

  const updateEvent = (eventId: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    );
    addToast({
      type: 'success',
      title: 'Event Settings Updated',
      description: 'Your changes have been saved.',
    });
  };

  const publishEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, status: 'published', updatedAt: new Date().toISOString() } : e
      )
    );
    addToast({
      type: 'success',
      title: 'Event Published',
      description: 'Public registration link is live and ready for attendees.',
    });
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => (prev || []).filter((e) => e.id !== eventId));
    if (activeEventId === eventId) {
      const remaining = (events || []).filter((e) => e.id !== eventId);
      if (remaining.length > 0) {
        setActiveEventId(remaining[0].id);
      }
    }
    addToast({
      type: 'warning',
      title: 'Event Deleted',
      description: 'Event has been permanently removed.',
    });
  };

  const updateOrganization = (updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      (prev || []).map((o) => (o.id === currentOrgId ? { ...o, ...updates } : o))
    );
    addToast({
      type: 'success',
      title: 'Organization Updated',
      description: 'Organization settings have been saved.',
    });
  };

  // Attendee actions
  const registerAttendee = (eventId: string, attendeeData: Partial<Attendee>): Attendee => {
    const targetEvent = events.find((e) => e.id === eventId) || activeEvent;
    const regCount = attendees.filter((a) => a.eventId === eventId).length + 1;
    const regId = generateRegId(regCount, 'EVT26');
    const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newAttendee: Attendee = {
      id,
      registrationId: regId,
      eventId: targetEvent ? targetEvent.id : activeEventId,
      eventName: targetEvent ? targetEvent.name : activeEvent?.name || 'Event',
      fullName: attendeeData.fullName || 'Anonymous Attendee',
      email: attendeeData.email || 'attendee@example.com',
      phone: attendeeData.phone || '+91 98000 00000',
      company: attendeeData.company || '',
      jobTitle: attendeeData.jobTitle || '',
      city: attendeeData.city || '',
      ticketType: attendeeData.ticketType || 'General Attendee',
      status: (attendeeData.status as any) || 'registered',
      registeredAt: new Date().toISOString(),
      qrToken: `TOK_${regId}_SECURE_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      customAnswers: attendeeData.customAnswers || {},
      notes: attendeeData.notes || '',
    };

    setAttendees((prev) => [newAttendee, ...prev]);
    addToast({
      type: 'success',
      title: 'Attendee Registered',
      description: `${newAttendee.fullName} (${newAttendee.registrationId}) pass generated.`,
    });
    return newAttendee;
  };

  const updateAttendee = (attendeeId: string, updates: Partial<Attendee>) => {
    setAttendees((prev) => prev.map((a) => (a.id === attendeeId ? { ...a, ...updates } : a)));
    addToast({
      type: 'success',
      title: 'Attendee Updated',
      description: 'Details updated successfully.',
    });
  };

  const cancelAttendee = (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendeeId ? { ...a, status: 'cancelled' } : a))
    );
    addToast({
      type: 'warning',
      title: 'Registration Cancelled',
      description: 'The attendee pass has been revoked.',
    });
  };

  const checkInAttendee = (attendeeId: string, entrance: string = 'Entrance A', staffName: string = 'Admin Operator') => {
    const att = (attendees || []).find((a) => a.id === attendeeId);
    if (att) {
      processCheckIn(att.registrationId, entrance, staffName);
    }
  };

  const undoCheckIn = (attendeeId: string) => {
    setAttendees((prev) =>
      (prev || []).map((a) =>
        a.id === attendeeId
          ? {
              ...a,
              status: 'registered',
              checkedInAt: undefined,
              checkedInBy: undefined,
              checkedInEntrance: undefined,
              checkedInDevice: undefined,
            }
          : a
      )
    );
    setCheckInLogs((prev) => (prev || []).filter((l) => l.attendeeId !== attendeeId));
    addToast({
      type: 'info',
      title: 'Check-in Reverted',
      description: 'Attendee marked as not checked in.',
    });
  };

  const getAttendeeById = (attendeeId: string) => (attendees || []).find((a) => a.id === attendeeId);
  const getAttendeeByRegId = (regId: string) =>
    (attendees || []).find((a) => (a.registrationId || '').toLowerCase() === (regId || '').toLowerCase().trim());

  // Check-In Engine (Real-time scan / manual verification)
  const processCheckIn = (
    identifierOrToken: string,
    entrance: string = selectedEntrance,
    staffName: string = 'Rahul Sundar (Staff 01)',
    device: string = 'Scanner #1 - iPad Pro Gate A'
  ): ScanResultState => {
    const raw = (identifierOrToken || '').trim();
    if (!raw) {
      playScanSound('invalid');
      return { type: 'invalid', success: false, message: 'Empty scan payload' };
    }

    // Try finding attendee by QR token or Reg ID or email/phone
    const attendee = (attendees || []).find(
      (a) =>
        a.qrToken === raw ||
        (a.registrationId || '').toLowerCase() === raw.toLowerCase() ||
        (a.phone || '').replace(/\s+/g, '') === raw.replace(/\s+/g, '') ||
        (a.email || '').toLowerCase() === raw.toLowerCase()
    );

    if (!attendee) {
      playScanSound('invalid');
      return {
        type: 'invalid',
        success: false,
        message: 'No attendee registration found for this QR token or ID.',
        scannedToken: raw,
      };
    }

    // Check if wrong event
    if (activeEvent && attendee.eventId !== activeEvent.id) {
      playScanSound('invalid');
      return {
        type: 'wrong_event',
        success: false,
        attendee,
        message: `This pass is registered for "${attendee.eventName}", not "${activeEvent.name}".`,
      };
    }

    // Check if cancelled
    if (attendee.status === 'cancelled') {
      playScanSound('invalid');
      return {
        type: 'cancelled',
        success: false,
        attendee,
        message: 'This registration has been cancelled/refunded.',
      };
    }

    // Check if duplicate check-in
    if (attendee.status === 'checked_in') {
      playScanSound('duplicate');
      return {
        type: 'duplicate',
        success: false,
        attendee,
        message: 'Attendee has ALREADY been checked in.',
        previousCheckInTime: attendee.checkedInAt
          ? new Date(attendee.checkedInAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })
          : 'Earlier today',
        previousEntrance: attendee.checkedInEntrance || 'Entrance A',
      };
    }

    // Valid First-Time Check-In!
    const nowISO = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Update attendee state
    const updatedAttendee: Attendee = {
      ...attendee,
      status: 'checked_in',
      checkedInAt: nowISO,
      checkedInBy: staffName,
      checkedInEntrance: entrance,
      checkedInDevice: device,
    };

    setAttendees((prev) => (prev || []).map((a) => (a.id === attendee.id ? updatedAttendee : a)));

    // Create log record
    const newLog: CheckInLog = {
      id: `chk-${Date.now()}`,
      eventId: attendee.eventId,
      attendeeId: attendee.id,
      attendeeName: attendee.fullName,
      registrationId: attendee.registrationId,
      company: attendee.company,
      timestamp: formattedTime,
      fullDateTime: nowISO,
      entrance,
      staffName,
      staffId: 'staff-01',
      device,
      type: 'qr_scan',
    };

    setCheckInLogs((prev) => [newLog, ...(prev || [])]);

    // Update staff count
    setStaffList((prev) =>
      (prev || []).map((s) =>
        s.assignedEntrance === entrance ? { ...s, checkInCount: (s.checkInCount || 0) + 1, lastActive: 'Just now' } : s
      )
    );

    playScanSound('success');
    return {
      type: 'success',
      success: true,
      attendee: updatedAttendee,
      checkInTime: formattedTime,
      entrance,
      staffName,
    };
  };

  // Staff actions
  const addStaff = (data: Omit<StaffMember, 'id' | 'checkInCount' | 'lastActive'>): StaffMember => {
    const id = `staff-${Date.now().toString().slice(-4)}`;
    const newStaff: StaffMember = {
      ...data,
      id,
      checkInCount: 0,
      lastActive: 'Just now',
    };
    setStaffList((prev) => [newStaff, ...prev]);
    addToast({
      type: 'success',
      title: 'Staff Member Added',
      description: `${newStaff.name} assigned to ${newStaff.assignedEntrance}`,
    });
    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addToast({ type: 'success', title: 'Staff Updated', description: 'Changes saved successfully.' });
  };

  const deleteStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    addToast({ type: 'info', title: 'Staff Removed', description: 'Access revoked for this user.' });
  };

  // Campaign actions
  const createCampaign = (data: Omit<MessageCampaign, 'id' | 'deliveryRate'>): MessageCampaign => {
    const id = `cmp-${Date.now().toString().slice(-4)}`;
    const newCampaign: MessageCampaign = {
      ...data,
      id,
      deliveryRate: data.status === 'sent' ? 99.1 : 0,
      sentAt: data.status === 'sent' ? new Date().toISOString() : undefined,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    addToast({
      type: 'success',
      title: 'Campaign Created',
      description: `"${newCampaign.title}" has been saved.`,
    });
    return newCampaign;
  };

  // Notification actions
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigateTo,
        currentRole,
        setCurrentRole,
        currentOrg,
        organizations,
        switchOrg,
        setCurrentOrgId: switchOrg,
        updateOrganization,
        events,
        activeEventId,
        activeEvent,
        setActiveEventId,
        createEvent,
        updateEvent,
        deleteEvent,
        publishEvent,
        attendees,
        eventAttendees,
        registerAttendee,
        updateAttendee,
        cancelAttendee,
        checkInAttendee,
        undoCheckIn,
        getAttendeeById,
        getAttendeeByRegId,
        checkInLogs,
        processCheckIn,
        staffList,
        staff: staffList,
        eventStaff,
        currentStaff,
        addStaff,
        addStaffMember: addStaff,
        updateStaff,
        deleteStaff,
        campaigns,
        eventCampaigns,
        createCampaign,
        addCampaign: createCampaign,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        toasts,
        addToast,
        removeToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedEntrance,
        setSelectedEntrance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
