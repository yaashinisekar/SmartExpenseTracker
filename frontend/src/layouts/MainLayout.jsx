import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
    ChartPieIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    TagIcon,
    ArrowRightStartOnRectangleIcon,
    UserCircleIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navItems = [
    { name: 'Dashboard',    path: '/dashboard',    icon: ChartPieIcon },
    { name: 'Transactions', path: '/transactions', icon: CurrencyDollarIcon },
    { name: 'Budgets',      path: '/budgets',      icon: CreditCardIcon },
    { name: 'Categories',   path: '/categories',   icon: TagIcon },
];

const MainLayout = () => {
    const logout   = useAuthStore((s) => s.logout);
    const user     = useAuthStore((s) => s.user);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const Sidebar = () => (
        <aside
            className="flex flex-col justify-between h-full"
            style={{
                background: 'rgba(10, 15, 30, 0.95)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '28px 20px',
            }}
        >
            {/* Logo */}
            <div>
                <div style={{ marginBottom: 40 }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 4,
                        }}
                    >
                        <div
                            style={{
                                width: 36, height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg,#14b8a6,#0891b2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 16px rgba(20,184,166,0.35)',
                            }}
                        >
                            <CurrencyDollarIcon style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <span
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            SmartExpense
                        </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#475569', paddingLeft: 46 }}>
                        Personal Finance Tracker
                    </p>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 14 }}>
                        Navigation
                    </p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User / Logout */}
            <div>
                <div
                    style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        marginBottom: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <UserCircleIcon style={{ width: 32, height: 32, color: '#2dd4bf', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="nav-link"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                    <ArrowRightStartOnRectangleIcon style={{ width: 18, height: 18 }} />
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0f1e' }}>
            {/* Desktop sidebar */}
            <div className="hidden md:block" style={{ width: 240, flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
                    <Sidebar />
                </div>
            </div>

            {/* Mobile top bar */}
            <div
                className="md:hidden"
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                    background: 'rgba(10,15,30,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg,#2dd4bf,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    SmartExpense
                </span>
                <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {mobileOpen ? <XMarkIcon style={{ width: 24, height: 24 }} /> : <Bars3Icon style={{ width: 24, height: 24 }} />}
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
                    <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260 }}>
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main content */}
            <main
                style={{
                    flex: 1,
                    padding: '48px 32px',
                    overflowY: 'auto',
                    minHeight: '100vh',
                }}
                className="md:pt-12 pt-24"
            >
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
