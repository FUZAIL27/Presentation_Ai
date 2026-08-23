import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/api/client';
import * as authApi from '@/api/auth';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(60),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Needs a lowercase letter')
      .regex(/[A-Z]/, 'Needs an uppercase letter')
      .regex(/[0-9]/, 'Needs a number')
      .regex(/[^a-zA-Z0-9]/, 'Needs a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function onSaveProfile(values: ProfileValues) {
    try {
      await authApi.updateProfile({ name: values.name });
      await refreshUser();
      toast('success', 'Profile updated');
    } catch (err) {
      toast('error', getErrorMessage(err));
    }
  }

  async function onChangePassword(values: PasswordValues) {
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast('success', 'Password changed. Please log in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      toast('error', getErrorMessage(err));
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
      toast('success', 'Avatar updated');
    } catch (err) {
      toast('error', getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-8 font-display text-2xl font-semibold text-ink">Settings</h1>

      <Card className="mb-6 p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-ink">Profile</h2>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-violet-cyan text-xl font-semibold text-white shadow-glow">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-ink text-paper"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{user?.email}</p>
            <p className="text-xs text-ink-faint">
              {user?.isEmailVerified ? 'Email verified' : 'Email not verified'}
            </p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
          <Input
            label="Full name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name')}
          />
          <Button type="submit" loading={profileForm.formState.isSubmitting} className="w-fit">
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-ink">Change password</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword')}
          />
          <Input
            label="Confirm new password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword')}
          />
          <Button type="submit" loading={passwordForm.formState.isSubmitting} className="w-fit">
            Update password
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 font-display text-base font-semibold text-ink">Plan</h2>
        <p className="text-sm text-ink-faint">
          You&apos;re on the <span className="font-medium text-ink">{user?.subscription.plan}</span> plan —{' '}
          {user?.subscription.presentationsGenerated} of {user?.subscription.presentationsLimit} presentations
          used.
        </p>
      </Card>
    </div>
  );
}
