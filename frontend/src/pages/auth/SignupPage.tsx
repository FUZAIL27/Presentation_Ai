import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/api/client';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[0-9]/, 'Needs a number')
    .regex(/[^a-zA-Z0-9]/, 'Needs a special character'),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await signup(values.name, values.email, values.password);
      toast('success', 'Account created! Check your email to verify it.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start turning topics into decks in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <p className="-mt-2 text-xs text-ink-faint">
          Use 8+ characters with upper &amp; lowercase letters, a number, and a symbol.
        </p>

        {submitError && <p className="text-sm text-ember-500">{submitError}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
