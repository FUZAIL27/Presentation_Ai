import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[0-9]/, 'Needs a number')
    .regex(/[^a-zA-Z0-9]/, 'Needs a special character'),
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await resetPassword(token, values.password);
      toast('success', 'Password reset. Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link">
        <p className="text-sm text-ink-soft">
          This reset link is missing its token. Please request a new one.
        </p>
        <Link to="/forgot-password" className="mt-4 block text-sm font-medium text-violet-600 hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Make it something you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {submitError && <p className="text-sm text-ember-500">{submitError}</p>}
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
