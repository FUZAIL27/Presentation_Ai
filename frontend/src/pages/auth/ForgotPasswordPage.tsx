import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { forgotPassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { MailCheck } from 'lucide-react';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-500/10 text-pine-500">
            <MailCheck className="h-6 w-6" />
          </div>
          <p className="text-sm text-ink-soft">
            If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in
            15 minutes.
          </p>
          <Link to="/login" className="mt-2 text-sm font-medium text-violet-600 hover:underline">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-violet-600 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        {submitError && <p className="text-sm text-ember-500">{submitError}</p>}
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
