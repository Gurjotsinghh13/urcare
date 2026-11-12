'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Stethoscope, 
  Thermometer, 
  Building2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = React.useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'admin',
      title: 'Administrator',
      email: 'admin@urcare.demo',
      password: 'URcareDemo!2026',
      icon: ShieldCheck,
      description: 'Facility oversight, bed assignment & discharge authorization',
    },
    {
      role: 'doctor',
      title: 'Doctor',
      email: 'doctor@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Stethoscope,
      description: 'Clinical rounds, treatment notes & discharge readiness review',
    },
    {
      role: 'nurse',
      title: 'Nurse',
      email: 'nurse@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Thermometer,
      description: 'Daily vitals measurement & afebrile streak tracking',
    },
    {
      role: 'manager',
      title: 'Facility Manager',
      email: 'manager@urcare.demo',
      password: 'URcareDemo!2026',
      icon: Building2,
      description: 'Operational capacity metrics, occupancy & export reports',
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedDemoRole(acc.role);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async (role: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo & Name */}
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#E88770] text-white font-semibold text-xl mb-3 shadow-sm">
          U
        </div>
        <h1 className="text-2xl font-semibold text-[#202124] tracking-tight">URCARE</h1>
        <p className="text-xs font-medium text-[#E88770] mt-1 tracking-wide uppercase">
          Smart Quarantine Facility Management
        </p>
        <p className="text-xs text-[#6B7280] mt-1">
          &ldquo;Better Coordination. Faster Recovery. Smarter Care.&rdquo;
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#EAE3E5] rounded-xl space-y-6 shadow-sm">
          {error && (
            <div className="p-3 bg-[#FAF8F8] border border-[#C04444] rounded-lg flex items-start gap-2.5 text-xs text-[#C04444]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C04444]" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                label="Staff Email Address"
                type="email"
                placeholder="name@urcare.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="md" className="w-full gap-2" isLoading={loading}>
              <span>Sign In to URCARE</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo Login Quick Panel */}
          <div className="pt-6 border-t border-[#EAE3E5]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-[#202124] uppercase tracking-wider">
                Demo Accounts
              </span>
              <span className="text-[11px] text-[#6B7280]">Select role to test workflow</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedDemoRole === acc.role;
                return (
                  <div
                    key={acc.role}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                      isSelected
                        ? 'border-[#E88770] bg-[#FCEEF1]'
                        : 'border-[#EAE3E5] bg-[#FAF8F8] hover:border-[#F4C7D3]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#202124]">{acc.title}</span>
                        <Icon className="w-4 h-4 text-[#E88770]" />
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-snug mb-2">
                        {acc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[#EAE3E5]">
                      <button
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className="text-[11px] font-medium text-[#202124] hover:bg-[#F7F0F1] bg-white px-2 py-1 rounded border border-[#EAE3E5] flex-1 text-center transition-colors"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInstantDemoLogin(acc.role)}
                        disabled={loading}
                        className="text-[11px] font-medium text-white bg-[#E88770] hover:bg-[#D97660] px-2.5 py-1 rounded transition-colors"
                      >
                        Login →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-[#6B7280] mt-6">
          URCARE Facility System • Role-Based Access Control • Clinical Audit Trail
        </p>
      </div>
    </div>
  );
}
