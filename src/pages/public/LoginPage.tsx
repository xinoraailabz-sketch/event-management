import React, { useState, useEffect } from 'react';
import { useApp, UserProfile } from '@/context/AppContext';
import {
  QrCode,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Smartphone,
  Info,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

export const LoginPage: React.FC = () => {
  const {
    navigateTo,
    setCurrentRole,
    setCurrentUser,
    activeEvent,
    events,
    setActiveEventId,
    addToast,
    refreshData,
  } = useApp();

  // Tab: 'admin' (Organizer Console) or 'staff' (Dedicated Staff Portal)
  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const staffTokenParam = params.get('staffToken') || params.get('token');
    const roleParam = params.get('role');

    if (emailParam) setEmail(emailParam);
    if (staffTokenParam) {
      setPassword(staffTokenParam);
      setActiveTab('staff');
    }
    if (roleParam === 'staff') {
      setActiveTab('staff');
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      addToast({
        type: 'info',
        title: 'Google Auth Initiated',
        description: err?.message || 'Redirecting to Google authentication...',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const performUnifiedLogin = async (cleanEmail: string, cleanPassword: string): Promise<boolean> => {
    // 1. Check if user exists in the staff table (handles temporary passwords and invited staff)
    try {
      const { data: staffMember } = await supabase
        .from('staff')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (staffMember) {
        const storedToken = (staffMember.login_token || staffMember.access_code || '').trim();
        const inputToken = cleanPassword.trim();
        const isTokenMatch =
          Boolean(storedToken) &&
          (storedToken === inputToken || storedToken.toLowerCase() === inputToken.toLowerCase());

        let isAuthValid = isTokenMatch;
        if (!isAuthValid) {
          // Check if they also have a Supabase Auth account with this password
          try {
            const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });
            if (!authErr && authData?.user) isAuthValid = true;
          } catch {}
        }

        if (isAuthValid) {
          const assignedRole: UserRole = staffMember.role === 'admin' ? 'admin' : 'staff';
          const staffUser: UserProfile = {
            id: staffMember.id,
            email: staffMember.email,
            fullName: staffMember.name,
            role: assignedRole,
          };

          setCurrentUser(staffUser);
          setCurrentRole(assignedRole);
          localStorage.setItem(
            'eventflow_active_session',
            JSON.stringify({
              user: staffUser,
              role: assignedRole,
              lastActive: Date.now(),
            })
          );

          await refreshData(staffUser);

          if (assignedRole === 'admin') {
            navigateTo('/app');
          } else {
            let targetEventId = '';
            const rawAssigned = staffMember.assigned_event_id || staffMember.event_id;
            if (rawAssigned && rawAssigned !== 'all') {
              targetEventId = rawAssigned.split(',')[0].trim();
            }

            if (!targetEventId) {
              targetEventId = activeEvent?.id || events[0]?.id;
            }

            if (targetEventId) {
              setActiveEventId(targetEventId);
              navigateTo(`/app/events/${targetEventId}/scanner`);
            } else {
              navigateTo('/app/scanner');
            }
          }

          addToast({
            type: 'success',
            title: 'Staff Access Granted',
            description: `Welcome ${staffMember.name}! Ready to scan attendees.`,
          });
          return true;
        }
      }
    } catch (err) {
      console.warn('Staff lookup notice:', err);
    }

    // 2. Authenticate with Supabase Auth (for Admins, Organizers, or Supabase registered accounts)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!authError && authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const role: UserRole = profile?.role === 'staff' ? 'staff' : 'admin';
        const authUser: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || cleanEmail,
          fullName: profile?.full_name || cleanEmail.split('@')[0],
          role: role,
        };

        setCurrentUser(authUser);
        setCurrentRole(role);
        localStorage.setItem(
          'eventflow_active_session',
          JSON.stringify({
            user: authUser,
            role,
            lastActive: Date.now(),
          })
        );

        await refreshData(authUser);

        if (role === 'staff') {
          const targetEventId = activeEvent?.id || events[0]?.id;
          if (targetEventId) navigateTo(`/app/events/${targetEventId}/scanner`);
          else navigateTo('/app/scanner');
        } else {
          navigateTo('/app');
        }

        addToast({
          type: 'success',
          title: 'Signed In Successfully',
          description: `Welcome back, ${authUser.fullName}`,
        });
        return true;
      }
    } catch (err) {
      console.warn('Supabase Auth signIn attempt notice:', err);
    }

    return false;
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      addToast({
        type: 'warning',
        title: 'Missing Details',
        description: 'Please enter both your email address and password.',
      });
      return;
    }

    setIsEmailLoading(true);

    try {
      const success = await performUnifiedLogin(cleanEmail, cleanPassword);
      if (!success) {
        addToast({
          type: 'error',
          title: 'Sign In Failed',
          description: 'Invalid email or password. Please verify your login credentials.',
        });
      }
    } catch (err: any) {
      console.error('Admin Login error:', err);
      addToast({
        type: 'error',
        title: 'Login Error',
        description: err?.message || 'An error occurred while signing in.',
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      addToast({
        type: 'warning',
        title: 'Missing Details',
        description: 'Please enter both your staff email and password or invitation code.',
      });
      return;
    }

    setIsEmailLoading(true);

    try {
      const success = await performUnifiedLogin(cleanEmail, cleanPassword);
      if (!success) {
        addToast({
          type: 'error',
          title: 'Staff Sign In Failed',
          description: 'Invalid staff email or password. Please verify the credentials sent in your invitation email.',
        });
      }
    } catch (err: any) {
      console.error('Staff Login error:', err);
      addToast({
        type: 'error',
        title: 'Login Error',
        description: err?.message || 'An error occurred while signing in.',
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
          EventFlow Portal
        </h2>
        <p className="mt-1 text-center text-xs text-[#6B6B6B]">
          Admin Console & Check-in Operations Desk
        </p>

        {/* Portal Switcher Tabs */}
        <div className="mt-6 p-1 bg-[#E8E5DF]/70 rounded-2xl flex items-center gap-1 border border-[#E8E5DF]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setEmail('');
              setPassword('');
            }}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeTab === 'admin'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            )}
          >
            <Shield className="w-4 h-4 text-[#C49A3C]" />
            <span>Admin Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setEmail('');
              setPassword('');
            }}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeTab === 'staff'
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            )}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Staff Portal</span>
          </button>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-[#E8E5DF]/70 bg-white">
          <CardContent className="p-0 space-y-5">
            {/* Tab 1: Admin Login with Google OAuth */}
            {activeTab === 'admin' && (
              <>
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-[#1A1A1A]">Organizer & Admin Sign In</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Sign in with Google or administrator password
                  </p>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#E8E5DF] bg-white hover:bg-[#FAFAF7] text-[#1A1A1A] text-xs font-semibold shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-[#C49A3C]/40 disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-[#9A9A9A] border-t-[#C49A3C] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Separator */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-[#F0EDE8] w-full" />
                  <span className="bg-white px-3 text-[11px] font-medium text-[#9A9A9A] uppercase tracking-wider absolute">
                    or with admin email
                  </span>
                </div>

                {/* Admin Email / Password Form */}
                <form className="space-y-4 pt-1" onSubmit={handleAdminEmailLogin}>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-xs font-semibold text-[#1A1A1A]">Admin Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 text-sm h-11 rounded-xl"
                        placeholder="organizer@eventflow.io"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password" className="text-xs font-semibold text-[#1A1A1A]">Password</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <Input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 text-sm h-11 rounded-xl"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {isEmailLoading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In as Admin</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Tab 2: Separate Staff Login Portal (NO Google Auth) */}
            {activeTab === 'staff' && (
              <>
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-[#1A1A1A]">Staff Scanner Sign In</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Enter your staff credentials sent in your invitation email
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Check-in staff operators can log in using their temporary password / invitation token.
                  </p>
                </div>

                {/* Staff Email & Password Form */}
                <form className="space-y-4 pt-1" onSubmit={handleStaffLogin}>
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-email" className="text-xs font-semibold text-[#1A1A1A]">Staff Email Address</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <Input
                        id="staff-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 text-sm h-11 rounded-xl"
                        placeholder="staff@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="staff-password" className="text-xs font-semibold text-[#1A1A1A]">Staff Password or Token</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                      <Input
                        id="staff-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 text-sm h-11 rounded-xl"
                        placeholder="Enter password or token"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                  >
                    {isEmailLoading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Scanner Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
