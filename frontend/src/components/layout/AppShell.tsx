import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Settings,
  LogOut,
  Presentation as PresentationIcon,
  Star,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'All decks', icon: LayoutGrid },
  { to: '/dashboard?favorite=true', label: 'Favorites', icon: Star },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleLogout() {
    try {
      await logout();
      toast('success', 'Logged out successfully');
      navigate('/login');
    } catch {
      toast('error', 'Something went wrong logging out');
    }
  }

  return (
    <>
      <NavLink to="/dashboard" onClick={onNavigate} className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow">
          <PresentationIcon className="h-4 w-4" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">PresentAI</span>
      </NavLink>

      <button
        onClick={() => {
          navigate('/generate');
          onNavigate?.();
        }}
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-violet-cyan text-sm font-medium text-white shadow-glow transition hover:brightness-110 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        New presentation
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={!item.to.includes('?')}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper-dim',
                isActive && 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-ink/10 pt-4">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-ink-faint">Appearance</span>
          <ThemeToggle />
        </div>
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper-dim',
              isActive && 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition hover:bg-paper-dim"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>

        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-paper-dim px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-violet-cyan text-xs font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.subscription.plan} plan</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-mesh-bg flex min-h-screen bg-paper">
      <aside className="glass sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col rounded-xl2 px-4 py-6 md:m-3 md:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="glass sticky top-0 z-nav flex h-16 shrink-0 items-center justify-between px-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-glow">
              <PresentationIcon className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-semibold">PresentAI</span>
          </NavLink>
          <button
            onClick={() => navigate('/generate')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-violet-cyan text-white shadow-glow"
            aria-label="New presentation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-dropdown bg-navy-900/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="glass-strong fixed inset-y-0 left-0 z-dropdown flex w-72 flex-col px-4 py-6 md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-4 top-6 flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
