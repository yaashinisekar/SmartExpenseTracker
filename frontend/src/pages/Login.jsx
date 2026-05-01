import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { EnvelopeIcon, LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const Login = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const { login, loading }      = useAuthStore();
    const navigate                = useNavigate();

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
        <div className="auth-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', top: '10%', left: '5%', width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', bottom: '10%', right: '5%', width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                        boxShadow: '0 8px 32px rgba(20,184,166,0.4)',
                        marginBottom: 16,
                    }}>
                        <CurrencyDollarIcon style={{ width: 28, height: 28, color: '#fff' }} />
                    </div>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '1.8rem', fontWeight: 800,
                        color: '#f1f5f9', letterSpacing: '-0.02em',
                        marginBottom: 6,
                    }}>
                        Welcome back
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Sign in to your SmartExpense account
                    </p>
                </div>

                {/* Card */}
                <div className="glass-panel" style={{ borderRadius: 20, padding: 36 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Email */}
                        <div>
                            <label className="form-label">Email address</label>
                            <div style={{ position: 'relative' }}>
                                <EnvelopeIcon style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 16, height: 16, color: '#475569',
                                }} />
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    className="input-dark"
                                    placeholder="you@example.com"
                                    style={{ paddingLeft: 40 }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <LockClosedIcon style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: 16, height: 16, color: '#475569',
                                }} />
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    className="input-dark"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: 40 }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: 4, fontSize: '0.95rem', padding: '14px' }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Signing in…
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ color: '#334155', fontSize: '0.8rem' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            style={{ color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }}
                        >
                            Create one free →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
