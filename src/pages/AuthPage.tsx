import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { navigate, useRouter } from '../lib/router';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { route } = useRouter();
  const { toast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const redirect = route.query.redirect || '/profile';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        toast('Account created! Welcome to Maison.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast('Welcome back!');
      }
      navigate(redirect);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 animate-fade-in">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-ink-200 shadow-card dark:border-ink-800 md:grid-cols-2">
        {/* visual */}
        <div className="relative hidden md:block">
          <img src="https://images.pexels.com/photos/5650026/pexels-photo-5650026.jpeg?auto=compress&cs=tinysrgb&w=900" alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-transparent" />
          <div className="absolute bottom-0 p-8 text-white">
            <h2 className="font-display text-2xl font-semibold">{isRegister ? 'Join the Maison list' : 'Welcome back'}</h2>
            <p className="mt-2 text-sm text-ink-200">{isRegister ? 'Get 10% off your first order and early access to new drops.' : 'Sign in to track orders, manage your wishlist, and check out faster.'}</p>
          </div>
        </div>

        {/* form */}
        <div className="p-8 md:p-10">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">M</span>
            <span className="font-display text-xl font-semibold">Maison</span>
          </div>
          <h1 className="font-display text-2xl font-semibold">{isRegister ? 'Create your account' : 'Sign in'}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => navigate(isRegister ? '/login' : '/register')} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="auth-name">Full name</label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input id="auth-name" className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
            )}
            <div>
              <label className="label" htmlFor="auth-email">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="auth-email" type="email" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="auth-pw">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input id="auth-pw" type={showPw ? 'text' : 'password'} className="input pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isRegister && <p className="mt-1.5 text-xs text-ink-400">Minimum 6 characters.</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Please wait…' : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-4 text-xs text-ink-400">
            By continuing you agree to our Terms and Privacy Policy. Email confirmation is not required.
          </p>
        </div>
      </div>
    </div>
  );
}
