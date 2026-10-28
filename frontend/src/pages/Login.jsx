import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { toast } from 'react-toastify';
import {
    EnvelopeIcon,
    LockClosedIcon,
    CurrencyDollarIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuthStore();
    const theme = useThemeStore((s) => s.theme);
    const toggleTheme = useThemeStore((s) => s.toggleTheme);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Welcome back! 👋');
            navigate('/dashboard');
        } catch {
            toast.error('Invalid credentials. Please try again.');
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'var(--bg-app)',
                position: 'relative',
            }}
            className="theme-transition"
        >
            {/* Top Right Theme Toggle */}
            <div style={{ position: 'absolute', top: 20, right: 24 }}>
                <button
                    onClick={toggleTheme}
                    className="neu-btn-secondary"
                    style={{ padding: '8px 14px', borderRadius: 12, fontSize: '0.82rem' }}
                    title="Toggle Theme"
                >
                    {theme === 'light' ? (
                        <>
                            <MoonIcon style={{ width: 16, height: 16, color: '#58739D' }} />
                            <span>Dark</span>
                        </>
                    ) : (
                        <>
                            <SunIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />
                            <span>Light</span>
                        </>
                    )}
                </button>
            </div>

            <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420 }}>
                {/* Header Branding */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div
                        className="neu-icon-badge"
                        style={{
                            width: 58,
                            height: 58,
                            borderRadius: 18,
                            background: 'var(--brand-gradient)',
                            boxShadow: '0 8px 24px rgba(16, 191, 174, 0.4)',
                            margin: '0 auto 16px',
                        }}
                    >
                        <CurrencyDollarIcon style={{ width: 32, height: 32, color: '#FFFFFF' }} />
                    </div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Welcome to SmartExpense
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sign in to access your personal finance intelligence
                    </p>
                </div>

                {/* Soft Neumorphic Card */}
                <div className="neu-card" style={{ padding: 36, borderRadius: 24 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <EnvelopeIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    className="neu-input"
                                    placeholder="you@example.com"
                                    style={{ paddingLeft: 40 }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)' }} />
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    className="neu-input"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: 40 }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="neu-btn-primary"
                            style={{ width: '100%', marginTop: 8, padding: '13px', fontSize: '0.92rem' }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--brand-teal)', fontWeight: 700, textDecoration: 'none' }}>
                            Create one free →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
