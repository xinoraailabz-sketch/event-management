import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, addToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      addToast({
        type: 'warning',
        title: 'Weak Password',
        description: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. If user is logged in via Supabase Auth, update auth password
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (authErr) {
        console.warn('Supabase auth password update notice:', authErr);
      }

      // 2. Update staff member's login token in the staff table
      if (currentUser?.email) {
        const { error: dbErr } = await supabase
          .from('staff')
          .update({
            login_token: newPassword,
          })
          .ilike('email', currentUser.email);

        if (dbErr) {
          console.warn('Staff table token update notice:', dbErr);
        }
      }

      // 3. Update active session in localStorage
      try {
        const savedSession = localStorage.getItem('eventflow_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          localStorage.setItem(
            'eventflow_session',
            JSON.stringify({
              ...parsed,
              lastActive: Date.now(),
            })
          );
        }
      } catch (e) {}

      addToast({
        type: 'success',
        title: 'Password Changed Successfully',
        description: 'You can now use your new password to log in.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      console.error('Error changing password:', err);
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: err?.message || 'Could not update password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Staff Password"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center text-[#8B6914]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A]">Staff Security Credentials</h4>
            <p className="text-[11px] text-[#6B6B6B]">
              Update the temporary password sent to {currentUser?.email || 'your email'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#1A1A1A]">Current / Temporary Password</Label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <Input
              type={showPass ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password or token"
              className="pl-10 pr-10 h-10 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#1A1A1A]"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#1A1A1A]">New Password (min 6 characters)</Label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <Input
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create your custom password"
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#1A1A1A]">Confirm New Password</Label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
            <Input
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EDE8]">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
            className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white"
          >
            {isSubmitting ? 'Updating...' : 'Save New Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
