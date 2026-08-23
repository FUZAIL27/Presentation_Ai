import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-faint">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/">
        <Button className="mt-2">Back home</Button>
      </Link>
    </div>
  );
}
