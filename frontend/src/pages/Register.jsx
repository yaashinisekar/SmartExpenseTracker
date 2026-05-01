import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { EnvelopeIcon, LockClosedIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: ''
    });
    const { register, loading } = useAuthStore();
    const navigate              = useNavigate();

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.firstName, formData.lastName, formData.email, formData.password);
            toast.success('Account created! Please sign in. 🎉');
            navigate('/login');
        } catch {
            toast.error('Registration failed. Email may already be in use.');
        }
    };

    return (
        <div className="auth-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', minHeight: '100vh' }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'fixed', top: '15%', right: '8%', width: 350, height: 350,
                background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', bottom: '15%', left: '5%', width: 250, height: 250,
                background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
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
                        color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6,
                    }}>
                        Create your account
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Start tracking your finances today — it's free
                    </p>
                </div>

                {/* Card */}
                <div className="glass-panel" style={{ borderRadius: 20, padding: 36 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Name row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">First Name</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#475569' }} />
                                    <input
                                        id="reg-firstname"
                                        type="text"
                                        name="firstName"
                                        required
                                        className="input-dark"
                                        placeholder="John"
                                        style={{ paddingLeft: 36 }}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Last Name</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#475569' }} />
                                    <input
                                        id="reg-lastname"
                                        type="text"
                                        name="lastName"
                                        required
                                        className="input-dark"
                                        placeholder="Doe"
                                        style={{ paddingLeft: 36 }}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <EnvelopeIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#475569' }} />
                                <input
                                    id="reg-email"
                                    type="email"
                                    name="email"
                                    required
                                    className="input-dark"
                                    placeholder="you@example.com"
                                    style={{ paddingLeft: 40 }}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <LockClosedIcon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#475569' }} />
                                <input
                                    id="reg-password"
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="input-dark"
                                    placeholder="Min. 6 characters"
                                    style={{ paddingLeft: 40 }}
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="reg-submit"
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: 4, fontSize: '0.95rem', padding: '14px' }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Creating Account…
                                </>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ color: '#334155', fontSize: '0.8rem' }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
