import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Presentation as PresentationIcon, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-4 z-nav px-4">
      <div
        className={cn(
          'mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full px-3 pl-5 transition-all duration-300',
          scrolled ? 'glass-strong shadow-glass' : 'glass',
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow">
            <PresentationIcon className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">PresentAI</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink-soft hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" variant="accent">
              Get started
            </Button>
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="glass-strong mx-auto mt-2 max-w-4xl rounded-2xl px-4 py-4 shadow-glass md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-1 text-sm font-medium text-ink-soft"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-faint">Appearance</span>
              <ThemeToggle />
            </div>
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" className="flex-1">
                <Button variant="accent" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
