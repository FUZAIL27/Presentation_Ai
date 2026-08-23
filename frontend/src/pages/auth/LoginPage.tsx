import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { rememberMe: true } });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await login(values.email, values.password, values.rememberMe);
      toast('success', 'Welcome back!');
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep building your decks."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-violet-600 hover:underline">
            Sign up
          </Link>
        </>
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
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-soft">
            <input type="checkbox" className="h-4 w-4 rounded border-ink/20" {...register('rememberMe')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-violet-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {submitError && <p className="text-sm text-ember-500">{submitError}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
