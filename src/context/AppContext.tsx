import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { generateRegId, playScanSound } from '../lib/utils';
import { sendRegistrationConfirmation, sendStaffInviteEmail } from '../lib/maileroo';
import { supabase } from '../lib/supabase';
import {
  mapDbToOrganization,
  mapOrganizationToDb,
  mapDbToEvent,
  mapEventToDb,
  mapDbToAttendee,
  mapAttendeeToDb,
  mapDbToCheckInLog,
  mapCheckInLogToDb,
  mapDbToStaff,
  mapStaffToDb,
  mapDbToCampaign,
  mapCampaignToDb,
  mapDbToNotification,
} from '../lib/db-mappers';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt?: string;
}

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

  // Auth & Profile
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;

  // Multi-tenancy & User State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentOrg: Organization;
  organizations: Organization[];
  switchOrg: (orgId: string) => void;
  setCurrentOrgId?: (orgId: string) => void;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;

  // Events
  events: EventItem[];
  activeEventId: string;
  activeEvent: EventItem | undefined;
  setActiveEventId: (eventId: string) => void;
  createEvent: (eventData: Partial<EventItem>) => Promise<EventItem>;
  updateEvent: (eventId: string, updates: Partial<EventItem>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  publishEvent: (eventId: string) => Promise<void>;

  // Attendees
  attendees: Attendee[];
  eventAttendees: Attendee[];
  registerAttendee: (
    eventId: string,
    attendeeData: Partial<Attendee>,
    explicitEvent?: EventItem
  ) => Promise<Attendee>;
  updateAttendee: (attendeeId: string, updates: Partial<Attendee>) => Promise<void>;
  cancelAttendee: (attendeeId: string) => Promise<void>;
  checkInAttendee: (attendeeId: string, entrance?: string, staffName?: string) => Promise<void>;
  undoCheckIn: (attendeeId: string) => Promise<void>;
  getAttendeeById: (attendeeId: string) => Attendee | undefined;
  getAttendeeByRegId: (regId: string) => Attendee | undefined;

  // Check-In Engine
  checkInLogs: CheckInLog[];
  processCheckIn: (
    identifierOrToken: string,
    entrance?: string,
    staffName?: string,
    device?: string
  ) => Promise<ScanResultState>;

  // Staff
  staffList: StaffMember[];
  staff: StaffMember[];
  eventStaff: StaffMember[];
  currentStaff: StaffMember | undefined;
  addStaff: (data: Omit<StaffMember, 'id' | 'checkInCount' | 'lastActive'>) => Promise<StaffMember>;
  addStaffMember: (data: any) => Promise<StaffMember>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  // Campaigns
  campaigns: MessageCampaign[];
  eventCampaigns: MessageCampaign[];
  createCampaign: (data: Omit<MessageCampaign, 'id' | 'deliveryRate'>) => Promise<MessageCampaign>;
  addCampaign: (data: any) => Promise<MessageCampaign>;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

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

  // Staff Password Change Modal
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (open: boolean) => void;

  // Loading state
  isLoading: boolean;
  refreshData: (user?: UserProfile | null) => Promise<void>;
}

const defaultInitialOrg: Organization = {
  id: 'org_default',
  name: 'My Workspace',
  slug: 'my-workspace',
  plan: 'growth',
  ownerName: 'Event Organizer',
  ownerEmail: 'organizer@eventflow.in',
  phone: '+91 98000 00000',
  city: 'Madurai',
  timezone: 'Asia/Kolkata (IST)',
  currency: 'INR (₹)',
  defaultBrandColor: '#4f46e5',
  activeEventsCount: 0,
  totalRegistrationsCount: 0,
  status: 'active',
  createdAt: new Date().toISOString(),
};

// Session & Inactivity Constants (15-Minute Timeout)
const SESSION_STORAGE_KEY = 'eventflow_active_session';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const getSavedSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const now = Date.now();
    if (session.lastActive && now - session.lastActive > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const persistSession = (user: UserProfile | null, role: UserRole) => {
  if (user) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        user,
        role,
        lastActive: Date.now(),
      })
    );
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const pathname = window.location.pathname;
    const hash = (window.location.hash || '').replace(/^#/, '');
    // If returning from Google OAuth with access_token fragment
    if (hash && (hash.startsWith('access_token=') || hash.includes('access_token=') || hash.startsWith('error='))) {
      try {
        window.history.replaceState(null, '', pathname && pathname !== '/' ? pathname : '/app');
      } catch {}
      return pathname && pathname !== '/' ? pathname : '/app';
    }
    if (hash) return hash;
    if (pathname && pathname !== '/') return pathname;
    const session = getSavedSession();
    return session?.user ? '/app' : '/login';
  });

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State - Initialized from persistent valid session
  const initialSession = getSavedSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => initialSession?.user || null);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (initialSession?.role === 'staff') return 'staff';
    return 'admin';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  const [organizations, setOrganizations] = useState<Organization[]>([defaultInitialOrg]);
  const [currentOrgId, setCurrentOrgId] = useState<string>('org_default');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>('');

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [selectedEntrance, setSelectedEntrance] = useState<string>('Main Gate / VIP Desk');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Tenant scoping refs to prevent cross-account realtime leakage
  const userOrgIdsRef = useRef<string[]>([]);
  const userEventIdsRef = useRef<string[]>([]);
  const isSigningOutRef = useRef<boolean>(false);

  // Synchronous refs to prevent dependency invalidation cascades
  const currentUserRef = useRef<UserProfile | null>(currentUser);
  currentUserRef.current = currentUser;
  const currentOrgIdRef = useRef<string>(currentOrgId);
  currentOrgIdRef.current = currentOrgId;

  // Toast Helpers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [newToast, ...prev]);

    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch live data from Supabase strictly scoped to the authenticated user's workspace
  const fetchDataFromSupabase = useCallback(
    async (targetUser?: UserProfile | null, targetOrgId?: string) => {
      if (isSigningOutRef.current) return;
      try {
        const activeUser = targetUser !== undefined ? targetUser : (currentUserRef.current || getSavedSession()?.user || null);

        // If no user is logged in, do not fetch any private multi-tenant workspace data
        if (!activeUser || !activeUser.email) {
          setEvents([]);
          setActiveEventId('');
          setAttendees([]);
          setCheckInLogs([]);
          setStaffList([]);
          setCampaigns([]);
          setIsLoading(false);
          return;
        }

        // 1. Fetch Organizations owned by or assigned to this user
        let mappedOrgs: Organization[] = [];
        let activeOrgId = targetOrgId || currentOrgIdRef.current;
        const staffAssignedEventIds: string[] = [];
        let staffHasUniversal = false;

        // A. Fetch staff records for this user email across all organizations
        const { data: staffRecs } = await supabase
          .from('staff')
          .select('*')
          .ilike('email', activeUser.email);

        const staffOrgIds: string[] = [];
        for (const st of staffRecs || []) {
          if (st.organization_id && !staffOrgIds.includes(st.organization_id)) {
            staffOrgIds.push(st.organization_id);
          }
          const rawAssigned = st.assigned_event_id || st.event_id;
          if (!rawAssigned || rawAssigned === 'all') {
            staffHasUniversal = true;
          } else {
            rawAssigned.split(',').forEach((id: string) => {
              const clean = id.trim();
              if (clean && !staffAssignedEventIds.includes(clean)) {
                staffAssignedEventIds.push(clean);
              }
            });
          }
        }

        if (activeUser.role === 'staff') {
          // If organization_id was missing on staff record, resolve it from assigned event(s)
          if (staffOrgIds.length === 0 && staffAssignedEventIds.length > 0) {
            const { data: evRows } = await supabase
              .from('events')
              .select('id, organization_id')
              .in('id', staffAssignedEventIds);

            if (evRows && evRows.length > 0) {
              evRows.forEach((r) => {
                if (r.organization_id && !staffOrgIds.includes(r.organization_id)) {
                  staffOrgIds.push(r.organization_id);
                }
              });
            }
          }

          if (staffOrgIds.length > 0) {
            const { data: orgsData } = await supabase
              .from('organizations')
              .select('*')
              .in('id', staffOrgIds);
            if (orgsData && orgsData.length > 0) {
              mappedOrgs = orgsData.map(mapDbToOrganization);
            }
          }
        } else {
          // Admin / Event Organizer: Fetch organizations owned by user PLUS organizations where user is an invited member/staff
          // Use two separate queries to avoid .or() PostgREST syntax issues
          const { data: ownedByEmail } = await supabase
            .from('organizations')
            .select('*')
            .ilike('owner_email', activeUser.email)
            .order('created_at', { ascending: true });

          const { data: ownedByUserId } = activeUser.id ? await supabase
            .from('organizations')
            .select('*')
            .eq('user_id', activeUser.id)
            .order('created_at', { ascending: true }) : { data: [] };

          // Merge owned orgs (dedup by id)
          const ownedOrgsMap = new Map<string, any>();
          [...(ownedByEmail || []), ...(ownedByUserId || [])].forEach((o) => {
            if (o && o.id) ownedOrgsMap.set(o.id, o);
          });
          const ownedOrgsData = Array.from(ownedOrgsMap.values());

          const combinedOrgIds = Array.from(new Set([
            ...(ownedOrgsData || []).map((o) => o.id),
            ...staffOrgIds,
          ]));

          if (combinedOrgIds.length > 0) {
            const { data: allOrgsData } = await supabase
              .from('organizations')
              .select('*')
              .in('id', combinedOrgIds)
              .order('created_at', { ascending: true });

            if (allOrgsData && allOrgsData.length > 0) {
              mappedOrgs = allOrgsData.map(mapDbToOrganization);
            }
          } else if (activeUser.id) {
            // Auto-provision personal workspace for first-time user
            const userOrgId = `org_${activeUser.id.substring(0, 8)}`;
            const userOrgName = `${activeUser.fullName || activeUser.email.split('@')[0]}'s Workspace`;
            const newOrgRow = {
              id: userOrgId,
              name: userOrgName,
              slug: `${(activeUser.fullName || 'workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-workspace`,
              plan: 'growth',
              owner_name: activeUser.fullName || 'Organizer',
              owner_email: activeUser.email,
              phone: '',
              city: '',
              user_id: activeUser.id,
            };

            const { data: createdOrg } = await supabase
              .from('organizations')
              .insert(newOrgRow)
              .select()
              .single();

            if (createdOrg) {
              mappedOrgs = [mapDbToOrganization(createdOrg)];
            }
          }
        }

        if (mappedOrgs.length > 0) {
          setOrganizations(mappedOrgs);
          if (!mappedOrgs.some((o) => o.id === activeOrgId)) {
            activeOrgId = mappedOrgs[0].id;
          }
          setCurrentOrgId(activeOrgId);
        }

        const userOrgIds = mappedOrgs.map((o) => o.id);
        userOrgIdsRef.current = userOrgIds;

        // If neither organization nor assigned event IDs exist, clear and return
        if (userOrgIds.length === 0 && staffAssignedEventIds.length === 0) {
          setEvents([]);
          setActiveEventId('');
          setAttendees([]);
          setCheckInLogs([]);
          setStaffList([]);
          setCampaigns([]);
          return;
        }

        // 2. Fetch Events strictly scoped to current user's organization(s) or staff assignments
        let mappedEvents: EventItem[] = [];

        if (activeUser.role === 'staff') {
          // If staff has specific assigned events, fetch those directly
          if (!staffHasUniversal && staffAssignedEventIds.length > 0) {
            const { data: eventsData, error: eventsErr } = await supabase
              .from('events')
              .select('*')
              .in('id', staffAssignedEventIds)
              .order('created_at', { ascending: false });

            if (eventsData && !eventsErr) {
              mappedEvents = eventsData.map(mapDbToEvent);
            }
          } else if (userOrgIds.length > 0) {
            // Staff has universal access to all events in their assigned organization
            const { data: eventsData, error: eventsErr } = await supabase
              .from('events')
              .select('*')
              .in('organization_id', userOrgIds)
              .order('created_at', { ascending: false });

            if (eventsData && !eventsErr) {
              mappedEvents = eventsData.map(mapDbToEvent);
            }
          }
        } else {
          // Admin / Organizer: Fetch all events for user's organizations OR where user is organizer
          // Use two separate queries and merge to avoid complex .or() syntax issues
          const eventsByOrg: any[] = [];
          const eventsByEmail: any[] = [];

          if (userOrgIds.length > 0) {
            const { data: evByOrg } = await supabase
              .from('events')
              .select('*')
              .in('organization_id', userOrgIds)
              .order('created_at', { ascending: false });
            if (evByOrg) eventsByOrg.push(...evByOrg);
          }

          // Also fetch events where user is listed as organizer email (cross-org)
          const { data: evByEmail } = await supabase
            .from('events')
            .select('*')
            .ilike('organizer_email', activeUser.email)
            .order('created_at', { ascending: false });
          if (evByEmail) eventsByEmail.push(...evByEmail);

          // Merge and deduplicate
          const allEventsMap = new Map<string, any>();
          [...eventsByOrg, ...eventsByEmail].forEach((ev) => {
            if (ev && ev.id && !allEventsMap.has(ev.id)) {
              allEventsMap.set(ev.id, ev);
            }
          });

          if (allEventsMap.size > 0) {
            mappedEvents = Array.from(allEventsMap.values()).map(mapDbToEvent);
          }
        }

        setEvents(mappedEvents);
        if (mappedEvents.length > 0) {
          const selectedEvent = mappedEvents.find((e) => e.id === activeEventId) || mappedEvents[0];
          setActiveEventId(selectedEvent.id);
          // Sync active organization with the selected event's organization
          if (selectedEvent.organizationId && mappedOrgs.some((o) => o.id === selectedEvent.organizationId)) {
            activeOrgId = selectedEvent.organizationId;
            setCurrentOrgId(activeOrgId);
          }
        } else {
          setActiveEventId('');
        }

        const userEventIds = mappedEvents.map((e) => e.id);
        userEventIdsRef.current = userEventIds;

        // 3. Fetch Attendees strictly for the user's events
        if (userEventIds.length > 0) {
          const { data: attendeesData, error: attErr } = await supabase
            .from('attendees')
            .select('*')
            .in('event_id', userEventIds)
            .order('created_at', { ascending: false });

          if (attendeesData && !attErr) {
            setAttendees(attendeesData.map(mapDbToAttendee));
          } else {
            setAttendees([]);
          }
        } else {
          setAttendees([]);
        }

        // 4. Fetch CheckIn Logs strictly for the user's events
        if (userEventIds.length > 0) {
          const { data: logsData, error: logsErr } = await supabase
            .from('check_in_logs')
            .select('*')
            .in('event_id', userEventIds)
            .order('full_date_time', { ascending: false });

          if (logsData && !logsErr) {
            setCheckInLogs(logsData.map(mapDbToCheckInLog));
          } else {
            setCheckInLogs([]);
          }
        } else {
          setCheckInLogs([]);
        }

        // 5. Fetch Staff strictly for user's organization(s)
        const { data: staffData, error: staffErr } = await supabase
          .from('staff')
          .select('*')
          .in('organization_id', userOrgIds)
          .order('created_at', { ascending: true });

        if (staffData && !staffErr) {
          setStaffList(staffData.map(mapDbToStaff));
        } else {
          setStaffList([]);
        }

        // 6. Fetch Campaigns strictly for user's events
        if (userEventIds.length > 0) {
          const { data: cmpData, error: cmpErr } = await supabase
            .from('campaigns')
            .select('*')
            .in('event_id', userEventIds)
            .order('created_at', { ascending: false });

          if (cmpData && !cmpErr) {
            setCampaigns(cmpData.map(mapDbToCampaign));
          } else {
            setCampaigns([]);
          }
        } else {
          setCampaigns([]);
        }

        // 7. Fetch Notifications
        const { data: notifData, error: notifErr } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (notifData && !notifErr) {
          setNotifications(notifData.map(mapDbToNotification));
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );
  const syncUserProfile = async (sessionUser: any) => {
    if (!sessionUser || isSigningOutRef.current) {
      return;
    }

    const email = sessionUser.email || '';
    const fullName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      email.split('@')[0];
    const avatarUrl =
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      '';

    try {
      // 1. Check if user is Workspace Owner (split queries to avoid .or() syntax issues)
      const { data: ownedOrgByEmail } = await supabase
        .from('organizations')
        .select('id, owner_email')
        .ilike('owner_email', email)
        .maybeSingle();

      const { data: ownedOrgByUserId } = sessionUser.id ? await supabase
        .from('organizations')
        .select('id, owner_email')
        .eq('user_id', sessionUser.id)
        .maybeSingle() : { data: null };

      const ownedOrg = ownedOrgByEmail || ownedOrgByUserId;

      const isGoogleAuth = sessionUser.app_metadata?.provider === 'google';
      const isWorkspaceOwner = !!ownedOrg;

      // 2. Check profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      const isProfileAdmin = existingProfile?.role === 'admin' || existingProfile?.role === 'organizer';

      // 3. Check staff table
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      const savedSession = getSavedSession();
      const isSavedStaffSession = savedSession?.role === 'staff';

      // Role Decision:
      // - Explicit staff session with a staff record -> STAFF
      // - Google OAuth login -> ADMIN
      // - Dedicated staff record without workspace -> STAFF
      // - Workspace Owner or profile admin/organizer -> ADMIN
      let userRole: UserRole = 'admin';

      if (isSavedStaffSession && staffRecord) {
        userRole = staffRecord.role === 'admin' ? 'admin' : 'staff';
      } else if (isGoogleAuth) {
        userRole = 'admin';
      } else if (staffRecord && !isWorkspaceOwner) {
        userRole = staffRecord.role === 'admin' ? 'admin' : 'staff';
      } else if (isWorkspaceOwner || isProfileAdmin || existingProfile?.role === 'organizer') {
        userRole = 'admin';
      } else if (staffRecord) {
        userRole = staffRecord.role === 'admin' ? 'admin' : 'staff';
      }

      const userProf: UserProfile = {
        id: sessionUser.id || staffRecord?.id || 'usr-default',
        email,
        fullName: existingProfile?.full_name || staffRecord?.name || fullName,
        avatarUrl: existingProfile?.avatar_url || avatarUrl,
        role: userRole,
        createdAt: existingProfile?.created_at,
      };

      // Persist profile in database if missing or update avatar
      if (!existingProfile && sessionUser.id) {
        supabase
          .from('profiles')
          .upsert({
            id: sessionUser.id,
            email,
            full_name: userProf.fullName,
            avatar_url: userProf.avatarUrl,
            role: userRole === 'admin' ? 'organizer' : 'staff',
          })
          .select()
          .maybeSingle()
          .then(() => {})
          .catch((err: any) => console.warn('Profile upsert notice:', err));
      } else if (existingProfile && avatarUrl && !existingProfile.avatar_url) {
        supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', sessionUser.id)
          .select()
          .maybeSingle()
          .then(() => {})
          .catch((err: any) => console.warn('Profile update notice:', err));
      }

      if (isSigningOutRef.current) return;

      setCurrentUser(userProf);
      setCurrentRole(userRole);
      persistSession(userProf, userRole);

      // Only redirect to dashboard if returning from an explicit OAuth callback (with access_token in hash)
      const currentHash = window.location.hash || '';
      const isOAuthCallback = currentHash.includes('access_token=') || window.location.search.includes('code=');

      if (isOAuthCallback) {
        if (currentHash.includes('access_token=')) {
          window.history.replaceState(null, '', '/app');
        }
        if (userRole === 'staff') {
          const assignedEvId = staffRecord?.assigned_event_id || staffRecord?.event_id;
          if (assignedEvId && assignedEvId !== 'all') {
            const targetId = assignedEvId.split(',')[0].trim();
            setActiveEventId(targetId);
            navigateTo(`/app/events/${targetId}/scanner`);
          } else {
            navigateTo('/app/scanner');
          }
        } else {
          navigateTo('/app');
        }
      }

      if (userRole === 'staff' && staffRecord) {
        // Staff persona: Fetch assigned organization, not personal workspace
        let assignedOrgId = staffRecord.organization_id;
        if (!assignedOrgId && (staffRecord.assigned_event_id || staffRecord.event_id)) {
          const rawId = (staffRecord.assigned_event_id || staffRecord.event_id).split(',')[0].trim();
          const { data: evData } = await supabase
            .from('events')
            .select('organization_id')
            .eq('id', rawId)
            .maybeSingle();
          if (evData?.organization_id) assignedOrgId = evData.organization_id;
        }

        if (assignedOrgId) {
          const { data: staffOrgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', assignedOrgId)
            .maybeSingle();

          if (staffOrgData) {
            const mapped = mapDbToOrganization(staffOrgData);
            setOrganizations([mapped]);
            setCurrentOrgId(mapped.id);
          }
        }
      } else {
        // Check if organization exists for this user in organizations table
        const { data: userOrgsByEmail } = await supabase
          .from('organizations')
          .select('*')
          .ilike('owner_email', email)
          .order('created_at', { ascending: true });

        const { data: userOrgsByUserId } = sessionUser.id ? await supabase
          .from('organizations')
          .select('*')
          .eq('user_id', sessionUser.id)
          .order('created_at', { ascending: true }) : { data: [] };

        // Merge and dedup
        const orgMergeMap = new Map<string, any>();
        [...(userOrgsByEmail || []), ...(userOrgsByUserId || [])].forEach((o) => {
          if (o && o.id) orgMergeMap.set(o.id, o);
        });
        const userOrgsData = Array.from(orgMergeMap.values());

        if (!userOrgsData || userOrgsData.length === 0) {
          const userOrgId = `org_${sessionUser.id.substring(0, 8)}`;
          const userOrgName = `${fullName}'s Workspace`;
          const newOrgRow = {
            id: userOrgId,
            name: userOrgName,
            slug: `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-workspace`,
            plan: 'growth',
            owner_name: fullName,
            owner_email: email,
            phone: '',
            city: '',
            user_id: sessionUser.id,
          };

          const { data: createdOrg } = await supabase
            .from('organizations')
            .insert(newOrgRow)
            .select()
            .single();

          if (createdOrg) {
            const mapped = mapDbToOrganization(createdOrg);
            setOrganizations([mapped]);
            setCurrentOrgId(mapped.id);
          }
        } else {
          const mappedOrgs = userOrgsData.map(mapDbToOrganization);
          setOrganizations(mappedOrgs);
          setCurrentOrgId(mappedOrgs[0].id);
        }
      }

      // Immediately fetch data strictly scoped to this authenticated user
      await fetchDataFromSupabase(userProf);
    } catch (err) {
      console.error('Error in syncUserProfile:', err);
    }
  };

  const signOut = async (isExpired: boolean = false) => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    // 1. Immediately wipe local session & state synchronously
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setCurrentRole('staff');
    setOrganizations([defaultInitialOrg]);
    setCurrentOrgId('org_default');
    setEvents([]);
    setActiveEventId('');
    setAttendees([]);
    setCheckInLogs([]);
    setStaffList([]);
    setCampaigns([]);
    setNotifications([]);
    userOrgIdsRef.current = [];
    userEventIdsRef.current = [];

    // 2. Navigate immediately to /login so the UI transitions cleanly without lag
    navigateTo('/login');

    // 3. Perform backend signOut asynchronously in the background
    try {
      await supabase.auth.signOut();
    } catch (e) {}

    // 4. Release signing out guard after transition settles
    setTimeout(() => {
      isSigningOutRef.current = false;
    }, 1500);

    if (isExpired) {
      addToast({
        type: 'warning',
        title: 'Session Expired',
        description: 'You have been automatically logged out due to 15 minutes of inactivity.',
        duration: 6000,
      });
    } else {
      addToast({
        type: 'info',
        title: 'Signed Out',
        description: 'You have been signed out successfully.',
      });
    }
  };

  // 15-Minute Inactivity Auto-Logout Tracker
  useEffect(() => {
    if (!currentUser) return;

    const handleActivity = () => {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          session.lastActive = Date.now();
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        }
      } catch {}
    };

    let lastThrottle = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 10000) {
        lastThrottle = now;
        handleActivity();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    activityEvents.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const intervalId = setInterval(() => {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          if (session.lastActive && Date.now() - session.lastActive >= INACTIVITY_TIMEOUT_MS) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            signOut(true);
          }
        }
      } catch {}
    }, 10000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, onActivity));
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Setup Auth Listener, Data Fetching & Realtime Channels
  useEffect(() => {
    const handlePopState = () => {
      const session = getSavedSession();
      setCurrentPath(window.location.pathname || (session?.user ? '/app' : '/login'));
    };
    window.addEventListener('popstate', handlePopState);

    // Initial Auth Session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          syncUserProfile(session.user);
        } else {
          const saved = getSavedSession();
          if (saved?.user) {
            fetchDataFromSupabase(saved.user);
          } else {
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.warn('Initial auth session check notice:', err);
        const saved = getSavedSession();
        if (saved?.user) {
          fetchDataFromSupabase(saved.user);
        } else {
          setIsLoading(false);
        }
      });

    // Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isSigningOutRef.current) return;
      if (event === 'SIGNED_OUT') {
        const saved = getSavedSession();
        // If this is a dedicated staff session (not Supabase Auth), don't wipe it on Supabase Auth's idle SIGNED_OUT
        if (saved?.user?.role === 'staff' || saved?.role === 'staff') {
          return;
        }
        setCurrentUser(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setEvents([]);
        setActiveEventId('');
        setAttendees([]);
        setCheckInLogs([]);
        setStaffList([]);
        setCampaigns([]);
        userOrgIdsRef.current = [];
        userEventIdsRef.current = [];
        setIsLoading(false);
        return;
      }
      if (session?.user) {
        syncUserProfile(session.user);
      }
    });

    // Supabase Realtime Channels (Isolated strictly to current user's org & events)
    const realtimeChannel = supabase
      .channel('fresh-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendees' },
        (payload) => {
          const rowEventId = (payload.new as any)?.event_id || (payload.old as any)?.event_id;
          if (rowEventId && !userEventIdsRef.current.includes(rowEventId)) {
            return; // Ignore attendee updates from other users' events
          }
          if (payload.eventType === 'INSERT') {
            const newAtt = mapDbToAttendee(payload.new);
            setAttendees((prev) => {
              if (prev.some((a) => a.id === newAtt.id)) return prev;
              return [newAtt, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToAttendee(payload.new);
            setAttendees((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setAttendees((prev) => prev.filter((a) => a.id !== deletedId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'check_in_logs' },
        (payload) => {
          const rowEventId = (payload.new as any)?.event_id || (payload.old as any)?.event_id;
          if (rowEventId && !userEventIdsRef.current.includes(rowEventId)) {
            return; // Ignore check-ins from other users' events
          }
          if (payload.eventType === 'INSERT') {
            const newLog = mapDbToCheckInLog(payload.new);
            setCheckInLogs((prev) => {
              if (prev.some((l) => l.id === newLog.id)) return prev;
              return [newLog, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setCheckInLogs((prev) => prev.filter((l) => l.id !== deletedId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          const rowOrgId = (payload.new as any)?.organization_id || (payload.old as any)?.organization_id;
          if (rowOrgId && !userOrgIdsRef.current.includes(rowOrgId)) {
            return; // Ignore events from other users' organizations
          }
          if (payload.eventType === 'INSERT') {
            const newEvt = mapDbToEvent(payload.new);
            setEvents((prev) => {
              if (prev.some((e) => e.id === newEvt.id)) return prev;
              const next = [newEvt, ...prev];
              userEventIdsRef.current = next.map((e) => e.id);
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToEvent(payload.new);
            setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setEvents((prev) => {
                const next = prev.filter((e) => e.id !== deletedId);
                userEventIdsRef.current = next.map((e) => e.id);
                return next;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        (payload) => {
          const rowOrgId = (payload.new as any)?.organization_id || (payload.old as any)?.organization_id;
          if (rowOrgId && !userOrgIdsRef.current.includes(rowOrgId)) {
            return; // Ignore staff members from other organizations
          }
          if (payload.eventType === 'INSERT') {
            const newStaff = mapDbToStaff(payload.new);
            setStaffList((prev) => {
              if (prev.some((s) => s.id === newStaff.id)) return prev;
              return [newStaff, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToStaff(payload.new);
            setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setStaffList((prev) => prev.filter((s) => s.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Global Command Palette Shortcut
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
  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0] || defaultInitialOrg;
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];

  const safeAttendees = attendees || [];
  const safeStaff = staffList || [];
  const safeCampaigns = campaigns || [];
  const safeEvents = events || [];

  const eventAttendees = activeEvent ? safeAttendees.filter((a) => a.eventId === activeEvent.id) : [];
  const eventStaff = activeEvent
    ? safeStaff.filter((s) => s.eventId === activeEvent.id || s.assignedEventId === activeEvent.id || s.assignedEventId === 'all')
    : safeStaff;
  const eventCampaigns = activeEvent ? safeCampaigns.filter((c) => c.eventId === activeEvent.id) : [];
  const currentStaff =
    safeStaff.find(
      (s) =>
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.id && s.id === currentUser.id)
    ) ||
    (currentUser?.role === 'staff'
      ? ({
          id: currentUser.id,
          name: currentUser.fullName,
          email: currentUser.email,
          role: 'staff',
          status: 'active',
          assignedGate: 'Any Location',
          assignedEntrance: 'Any Location',
          checkInCount: 0,
          lastActive: 'Just now',
        } as StaffMember)
      : safeStaff[0]);

  // Dynamic Event Stats calculation
  useEffect(() => {
    setEvents((prevEvents) =>
      (prevEvents || []).map((evt) => {
        const evAtts = (attendees || []).filter((a) => a.eventId === evt.id);
        const registered = evAtts.filter((a) => a.status === 'registered').length;
        const checkedIn = evAtts.filter((a) => a.status === 'checked_in' || a.status === 'walk_in').length;
        const cancelled = evAtts.filter((a) => a.status === 'cancelled').length;
        const walkIns = evAtts.filter((a) => a.status === 'walk_in').length;
        const totalRegs = evAtts.filter((a) => a.status !== 'cancelled').length;
        const cap = evt.settings?.capacity || 500;
        const pct = cap > 0 ? (checkedIn / (totalRegs || 1)) * 100 : 0;

        return {
          ...evt,
          stats: {
            totalRegistrations: totalRegs,
            totalCheckedIn: checkedIn,
            totalCancelled: cancelled,
            totalWalkIns: walkIns,
            capacity: cap,
            attendancePercentage: Math.round(pct * 10) / 10,
          },
        };
      })
    );
  }, [attendees]);

  // Organization Actions
  const switchOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    const orgEvent = events.find((e) => e.organizationId === orgId);
    if (orgEvent) {
      setActiveEventId(orgEvent.id);
    }
    const foundOrg = organizations.find((o) => o.id === orgId);
    addToast({
      type: 'info',
      title: 'Switched Workspace',
      description: `Active organization changed to ${foundOrg?.name || orgId}`,
    });
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      (prev || []).map((o) => (o.id === currentOrgId ? { ...o, ...updates } : o))
    );

    try {
      const dbRow = mapOrganizationToDb(updates);
      const { error } = await supabase
        .from('organizations')
        .update(dbRow)
        .eq('id', currentOrgId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Organization Updated',
        description: 'Organization settings have been saved to Supabase.',
      });
    } catch (err: any) {
      console.error('Error updating organization in Supabase:', err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: err.message || 'Could not update organization settings.',
      });
    }
  };

  // Event Actions (CRUD)
  const createEvent = async (eventData: Partial<EventItem>): Promise<EventItem> => {
    const rawName = eventData?.name || 'new-event';
    const slug = (rawName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `evt-${slug || 'event'}-${Date.now().toString().slice(-4)}`;

    const newEvent: EventItem = {
      id,
      slug: `${slug}-${Math.random().toString(36).substr(2, 4)}`,
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
      city: eventData.city || currentOrg.city || 'Madurai',
      organizerName: eventData.organizerName || currentOrg.ownerName || 'Organizer',
      organizerContact: eventData.organizerContact || currentOrg.phone || '',
      organizerEmail: eventData.organizerEmail || currentOrg.ownerEmail || '',
      website: eventData.website,
      status: (eventData.status as any) || 'published',
      branding: eventData.branding || {
        primaryColor: currentOrg.defaultBrandColor || '#4f46e5',
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

    // Optimistic UI update
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    userEventIdsRef.current = [newEvent.id, ...userEventIdsRef.current];

    try {
      const dbRow = mapEventToDb(newEvent);
      const { error } = await supabase.from('events').insert(dbRow);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Event Created',
        description: `"${newEvent.name}" saved to database.`,
      });
    } catch (err: any) {
      console.error('Error inserting event in Supabase:', err);
    }

    return newEvent;
  };

  const updateEvent = async (eventId: string, updates: Partial<EventItem>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e))
    );

    try {
      const dbRow = mapEventToDb(updates);
      const { error } = await supabase.from('events').update(dbRow).eq('id', eventId);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Event Settings Updated',
        description: 'Your changes have been saved to Supabase.',
      });
    } catch (err: any) {
      console.error('Error updating event in Supabase:', err);
    }
  };

  const publishEvent = async (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, status: 'published', updatedAt: new Date().toISOString() } : e
      )
    );

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Event Published',
        description: 'Public registration link is live.',
      });
    } catch (err: any) {
      console.error('Error publishing event:', err);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setEvents((prev) => (prev || []).filter((e) => e.id !== eventId));
    if (activeEventId === eventId) {
      const remaining = (events || []).filter((e) => e.id !== eventId);
      if (remaining.length > 0) {
        setActiveEventId(remaining[0].id);
      } else {
        setActiveEventId('');
      }
    }

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;

      addToast({
        type: 'warning',
        title: 'Event Deleted',
        description: 'Event has been permanently removed.',
      });
    } catch (err: any) {
      console.error('Error deleting event in Supabase:', err);
    }
  };

  // Attendee Actions (CRUD)
  const registerAttendee = async (
    eventId: string,
    attendeeData: Partial<Attendee>,
    explicitEvent?: EventItem
  ): Promise<Attendee> => {
    // 1. Resolve target event (from explicit param, memory, or directly from Supabase)
    let targetEvent = explicitEvent || events.find((e) => e.id === eventId) || activeEvent;
    if (!targetEvent && eventId) {
      const { data: evData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      if (evData) {
        targetEvent = mapDbToEvent(evData);
      }
    }

    // 2. Strict Live Capacity Verification against Supabase
    const maxCapacity = targetEvent?.settings?.capacity ?? 0;
    if (maxCapacity > 0) {
      const { count: liveCount, error: countErr } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .neq('status', 'cancelled');

      if (!countErr && liveCount !== null && liveCount >= maxCapacity) {
        const errorMsg = `This event has reached its maximum capacity limit of ${maxCapacity} attendee(s). Registrations are now closed.`;
        addToast({
          type: 'error',
          title: 'Capacity Reached',
          description: errorMsg,
          duration: 6000,
        });
        throw new Error(errorMsg);
      }
    }

    // 3. Generate Registration ID
    let currentTotal = attendees.filter((a) => a.eventId === eventId).length;
    if (currentTotal === 0) {
      const { count } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      currentTotal = count || 0;
    }
    const regCount = currentTotal + 1;
    const regId = generateRegId(regCount, 'EVT26');
    const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newAttendee: Attendee = {
      id,
      registrationId: regId,
      eventId: targetEvent ? targetEvent.id : eventId,
      eventName: targetEvent ? targetEvent.name : 'Event',
      fullName: attendeeData.fullName || 'Anonymous Attendee',
      email: attendeeData.email || 'attendee@example.com',
      phone: attendeeData.phone || '+91 98000 00000',
      company: attendeeData.company || '',
      jobTitle: attendeeData.jobTitle || '',
      city: attendeeData.city || targetEvent?.city || '',
      ticketType: attendeeData.ticketType || 'General Attendee',
      status: (attendeeData.status as any) || 'registered',
      registeredAt: new Date().toISOString(),
      qrToken: `TOK_${regId}_SECURE_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      customAnswers: attendeeData.customAnswers || {},
      notes: attendeeData.notes || '',
    };

    // 4. Save Attendee to Supabase
    const dbRow = mapAttendeeToDb(newAttendee);
    const { error: insertErr } = await supabase.from('attendees').insert(dbRow);
    if (insertErr) {
      console.error('Error saving attendee to Supabase:', insertErr);
      throw insertErr;
    }

    // Optimistic UI state update
    setAttendees((prev) => [newAttendee, ...prev]);

    // Update local stats for the event
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              stats: {
                ...ev.stats,
                totalRegistrations: (ev.stats?.totalRegistrations || 0) + 1,
              },
            }
          : ev
      )
    );

    addToast({
      type: 'success',
      title: 'Attendee Registered',
      description: `${newAttendee.fullName} (${newAttendee.registrationId}) pass generated.`,
    });

    // 5. Send registration confirmation email with QR ticket
    if (targetEvent && newAttendee.email && newAttendee.email !== 'attendee@example.com') {
      try {
        const result = await sendRegistrationConfirmation(newAttendee, targetEvent);
        if (result.success) {
          addToast({
            type: 'info',
            title: 'Confirmation Email Sent',
            description: `Ticket emailed to ${newAttendee.email}`,
            duration: 4000,
          });
        } else {
          console.warn('[Email] Registration confirmation notice:', result.message);
        }
      } catch (err) {
        console.error('[Email] Failed to send registration email:', err);
      }
    }

    return newAttendee;
  };

  const updateAttendee = async (attendeeId: string, updates: Partial<Attendee>) => {
    setAttendees((prev) => prev.map((a) => (a.id === attendeeId ? { ...a, ...updates } : a)));

    try {
      const dbRow = mapAttendeeToDb(updates);
      const { error } = await supabase.from('attendees').update(dbRow).eq('id', attendeeId);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Attendee Updated',
        description: 'Details updated successfully.',
      });
    } catch (err: any) {
      console.error('Error updating attendee in Supabase:', err);
    }
  };

  const cancelAttendee = async (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendeeId ? { ...a, status: 'cancelled' } : a))
    );

    try {
      const { error } = await supabase
        .from('attendees')
        .update({ status: 'cancelled' })
        .eq('id', attendeeId);

      if (error) throw error;

      addToast({
        type: 'warning',
        title: 'Registration Cancelled',
        description: 'The attendee pass has been revoked.',
      });
    } catch (err: any) {
      console.error('Error cancelling attendee in Supabase:', err);
    }
  };

  const checkInAttendee = async (
    attendeeId: string,
    entrance: string = 'Entrance A',
    staffName: string = 'Admin Operator'
  ) => {
    const att = (attendees || []).find((a) => a.id === attendeeId);
    if (att) {
      await processCheckIn(att.registrationId, entrance, staffName);
    }
  };

  const undoCheckIn = async (attendeeId: string) => {
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

    try {
      await supabase
        .from('attendees')
        .update({
          status: 'registered',
          checked_in_at: null,
          checked_in_by: null,
          checked_in_entrance: null,
          checked_in_device: null,
        })
        .eq('id', attendeeId);

      await supabase.from('check_in_logs').delete().eq('attendee_id', attendeeId);

      addToast({
        type: 'info',
        title: 'Check-in Reverted',
        description: 'Attendee marked as not checked in.',
      });
    } catch (err: any) {
      console.error('Error undoing checkin in Supabase:', err);
    }
  };

  const getAttendeeById = (attendeeId: string) =>
    (attendees || []).find((a) => a.id === attendeeId);

  const getAttendeeByRegId = (regId: string) =>
    (attendees || []).find(
      (a) => (a.registrationId || '').toLowerCase() === (regId || '').toLowerCase().trim()
    );

  // Check-In Engine (Real-time scan & manual verification)
  const processCheckIn = async (
    identifierOrToken: string,
    entrance: string = selectedEntrance,
    staffName: string = 'Rahul Sundar (Staff 01)',
    device: string = 'Scanner #1 - iPad Pro Gate A'
  ): Promise<ScanResultState> => {
    const raw = (identifierOrToken || '').trim();
    if (!raw) {
      playScanSound('invalid');
      return { type: 'invalid', success: false, message: 'Empty scan payload' };
    }

    // Clean raw token & extract ID if full URL was encoded in QR
    let cleanToken = raw;
    if (raw.includes('/pass/')) {
      const parts = raw.split('/pass/');
      if (parts[1]) cleanToken = parts[1].split('?')[0].split('/')[0];
    }

    // Lookup attendee
    const attendee = (attendees || []).find(
      (a) =>
        a.qrToken === cleanToken ||
        a.qrToken === raw ||
        a.id === cleanToken ||
        (a.registrationId || '').toLowerCase() === cleanToken.toLowerCase() ||
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

    // Check wrong event
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

    // Duplicate check-in
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

    const updatedAttendee: Attendee = {
      ...attendee,
      status: 'checked_in',
      checkedInAt: nowISO,
      checkedInBy: staffName,
      checkedInEntrance: entrance,
      checkedInDevice: device,
    };

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

    // Optimistic UI updates
    setAttendees((prev) => (prev || []).map((a) => (a.id === attendee.id ? updatedAttendee : a)));
    setCheckInLogs((prev) => [newLog, ...(prev || [])]);
    setStaffList((prev) =>
      (prev || []).map((s) =>
        s.assignedEntrance === entrance
          ? { ...s, checkInCount: (s.checkInCount || 0) + 1, lastActive: 'Just now' }
          : s
      )
    );

    // Persist to Supabase
    try {
      await supabase
        .from('attendees')
        .update({
          status: 'checked_in',
          checked_in_at: nowISO,
          checked_in_by: staffName,
          checked_in_entrance: entrance,
          checked_in_device: device,
        })
        .eq('id', attendee.id);

      await supabase.from('check_in_logs').insert(mapCheckInLogToDb(newLog));
    } catch (err: any) {
      console.error('Error persisting check-in to Supabase:', err);
    }

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

  // Staff Actions (CRUD)
  const addStaff = async (
    data: Omit<StaffMember, 'id' | 'checkInCount' | 'lastActive'>
  ): Promise<StaffMember> => {
    const id = `staff-${Date.now().toString().slice(-4)}`;

    // Generate a temporary password for the staff member
    const tempPassword = Math.random().toString(36).slice(2, 6).toUpperCase() +
      Math.random().toString(36).slice(2, 6) +
      Math.floor(Math.random() * 90 + 10);

    const newStaff: StaffMember = {
      ...data,
      id,
      organizationId: data.organizationId || currentOrg.id,
      checkInCount: 0,
      lastActive: 'Just now',
      loginToken: tempPassword,
    };

    setStaffList((prev) => [newStaff, ...prev]);

    try {
      const dbRow = mapStaffToDb(newStaff);
      const { error } = await supabase.from('staff').insert(dbRow);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Staff Member Added',
        description: `${newStaff.name} invited and saved.`,
      });

      // Send staff invite email with username, temporary password, and direct login link via Maileroo
      const staffEmail = (data as any).email;
      if (staffEmail) {
        const staffWithEmail = { ...newStaff, email: staffEmail, tempPassword };
        const targetEvent =
          events.find((e) => e.id === newStaff.assignedEventId) ||
          activeEvent ||
          events[0] ||
          ({
            id: 'universal',
            name: 'All Events (Universal)',
            city: currentOrg.city || 'Event Venue',
            slug: 'staff-portal',
          } as EventItem);

        sendStaffInviteEmail(staffWithEmail, targetEvent, tempPassword)
          .then((result) => {
            if (result.success) {
              addToast({
                type: 'info',
                title: 'Staff Credentials Sent',
                description: `Login email & temporary password sent to ${staffEmail}`,
                duration: 5000,
              });
            } else {
              console.warn('[Email] Staff invite email notice:', result.message);
              addToast({
                type: 'warning',
                title: 'Email Delivery Notice',
                description: `Staff saved. Email status: ${result.message}`,
                duration: 6000,
              });
            }
          })
          .catch((err) => console.error('[Email] Failed to send staff invite:', err));
      }
    } catch (err: any) {
      console.error('Error adding staff to Supabase:', err);
    }

    return newStaff;
  };

  const addStaffMember = (data: any) => addStaff(data);

  const updateStaff = async (id: string, updates: Partial<StaffMember>) => {
    const targetMember = staffList.find((s) => s.id === id);
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

    try {
      const dbRow = mapStaffToDb(updates);
      const { error } = await supabase.from('staff').update(dbRow).eq('id', id);
      if (error) throw error;

      // If role was updated and email exists, also sync profiles table
      if (updates.role && targetMember?.email) {
        const mappedRole = updates.role === 'admin' ? 'admin' : 'staff';
        await supabase
          .from('profiles')
          .update({ role: mappedRole })
          .ilike('email', targetMember.email);

        // If current session is this user, update active role dynamically
        if (currentUser?.email?.toLowerCase() === targetMember.email.toLowerCase()) {
          setCurrentRole(mappedRole as UserRole);
          const updatedUser: UserProfile = {
            ...currentUser,
            role: mappedRole as UserRole,
          };
          setCurrentUser(updatedUser);
          persistSession(updatedUser, mappedRole as UserRole);
        }
      }

      addToast({
        type: 'success',
        title: 'Staff Updated',
        description: updates.role
          ? `Role set to ${updates.role === 'admin' ? 'Admin Access' : 'Scan Access'}`
          : 'Staff details saved successfully.',
      });
    } catch (err: any) {
      console.error('Error updating staff in Supabase:', err);
    }
  };

  const deleteStaff = async (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));

    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;

      addToast({
        type: 'info',
        title: 'Staff Removed',
        description: 'Access revoked for this user.',
      });
    } catch (err: any) {
      console.error('Error deleting staff from Supabase:', err);
    }
  };

  // Campaign Actions (CRUD)
  const createCampaign = async (
    data: Omit<MessageCampaign, 'id' | 'deliveryRate'>
  ): Promise<MessageCampaign> => {
    const id = `cmp-${Date.now().toString().slice(-4)}`;
    const newCampaign: MessageCampaign = {
      ...data,
      id,
      deliveryRate: data.status === 'sent' ? 99.1 : 0,
      sentAt: data.status === 'sent' ? new Date().toISOString() : undefined,
    };

    setCampaigns((prev) => [newCampaign, ...prev]);

    try {
      const dbRow = mapCampaignToDb(newCampaign);
      const { error } = await supabase.from('campaigns').insert(dbRow);
      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Campaign Created',
        description: `"${newCampaign.title}" has been saved.`,
      });
    } catch (err: any) {
      console.error('Error creating campaign in Supabase:', err);
    }

    return newCampaign;
  };

  const addCampaign = (data: any) => createCampaign(data);

  // Notification Actions
  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (err) {
      console.error('Error updating notification in Supabase:', err);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await supabase.from('notifications').update({ read: true }).neq('id', '');
    } catch (err) {
      console.error('Error clearing notifications in Supabase:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigateTo,
        currentUser,
        setCurrentUser,
        signOut,
        currentRole,
        setCurrentRole,
        currentOrg,
        organizations,
        switchOrg,
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
        addStaffMember,
        updateStaff,
        deleteStaff,
        campaigns,
        eventCampaigns,
        createCampaign,
        addCampaign,
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
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        isLoading,
        refreshData: fetchDataFromSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
