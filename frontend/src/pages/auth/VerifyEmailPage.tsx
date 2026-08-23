import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { verifyEmail } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Spinner } from '@/components/ui/Card';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    verifyEmail(token)
      .then((msg) => {
        setStatus('success');
        setMessage(msg);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(getErrorMessage(err));
      });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="flex flex-col items-center gap-3 text-center">
        {status === 'loading' && <Spinner className="h-8 w-8" />}
        {status === 'success' && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-500/10 text-pine-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        )}
        {status === 'error' && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-500/10 text-ember-500">
            <XCircle className="h-6 w-6" />
          </div>
        )}
        {message && <p className="text-sm text-ink-soft">{message}</p>}
        <Link to="/dashboard" className="mt-2 text-sm font-medium text-violet-600 hover:underline">
          Go to dashboard
        </Link>
      </div>
    </AuthLayout>
  );
}
