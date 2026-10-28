import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import {
    ChartPieIcon,
    CurrencyDollarIcon,
    CreditCardIcon,
    TagIcon,
    SparklesIcon,
    ArrowRightStartOnRectangleIcon,
    UserCircleIcon,
    Bars3Icon,
    XMarkIcon,
    SunIcon,
    MoonIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { format } from 'date-fns';

const navItems = [
    { name: 'Dashboard',           path: '/dashboard',    icon: ChartPieIcon },
    { name: 'Transactions',        path: '/transactions', icon: CurrencyDollarIcon },
    { name: 'Budgets',             path: '/budgets',      icon: CreditCardIcon },
    { name: 'Categories',          path: '/categories',   icon: TagIcon },
    { name: 'LifeLens Simulator',  path: '/lifelens',     icon: SparklesIcon },
];

const MainLayout = () => {
    const logout   = useAuthStore((s) => s.logout);
    const user     = useAuthStore((s) => s.user);
    const theme    = useThemeStore((s) => s.theme);
    const toggleTheme = useThemeStore((s) => s.toggleTheme);
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const todayDate = format(new Date(), 'EEEE, dd MMM yyyy');

    const SidebarContent = () => (
        <aside
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                background: 'var(--bg-sidebar)',
                borderRight: '1px solid var(--border-subtle)',
                padding: '24px 18px',
            }}
        >
            {/* Top Branding & Nav */}
            <div>
                {/* Brand Logo Header */}
                <div style={{ marginBottom: 32, paddingLeft: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        className="neu-icon-badge"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: 'var(--brand-gradient)',
                            boxShadow: '0 4px 14px rgba(16, 191, 174, 0.4)',
                            flexShrink: 0,
                        }}
                    >
                        <CurrencyDollarIcon style={{ width: 24, height: 24, color: '#FFFFFF' }} />
                    </div>
                    <div>
                        <span
                            className="font-heading"
                            style={{
                                fontSize: '1.28rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #10BFAE, #16BCE0)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em',
                                display: 'block',
                            }}
                        >
                            SmartExpense
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Fintech Intelligence
                        </span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 12 }}>
                        Menu
                    </p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => `neu-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon style={{ width: 19, height: 19, flexShrink: 0 }} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom Promo & User Controls */}
            <div>
                {/* LifeLens Mini Promo Card */}
                <div
                    className="neu-card-flat"
                    style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        marginBottom: 16,
                        background: 'linear-gradient(135deg, rgba(16, 191, 174, 0.08), rgba(22, 188, 224, 0.08))',
                        border: '1px solid rgba(16, 191, 174, 0.25)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <SparklesIcon style={{ width: 16, height: 16, color: 'var(--brand-teal)' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            LifeLens™ Simulator
                        </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginBottom: 8 }}>
                        Test decisions before spending money.
                    </p>
                    <NavLink
                        to="/lifelens"
                        style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--brand-teal)',
                            textDecoration: 'none',
                        }}
                    >
                        Explore Scenarios →
                    </NavLink>
                </div>

                {/* User Info Card */}
                <div
                    className="neu-card-flat"
                    style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <div
                        className="neu-icon-badge"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'var(--brand-gradient)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            flexShrink: 0,
                        }}
                    >
                        {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.email}
                        </p>
                    </div>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={handleLogout}
                    className="neu-btn-danger"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    <ArrowRightStartOnRectangleIcon style={{ width: 16, height: 16 }} />
                    Sign Out
                </button>
            </div>
        </aside>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-app)' }} className="theme-transition">
            {/* Desktop Sidebar */}
            <div className="hidden md:block" style={{ width: 250, flexShrink: 0 }}>
                <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
                    <SidebarContent />
                </div>
            </div>

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Navigation Bar */}
                <header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 30,
                        background: 'var(--bg-surface)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid var(--border-subtle)',
                        padding: '12px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    }}
                >
                    {/* Left: Mobile hamburger & Date indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden neu-btn-secondary"
                            style={{ padding: '8px 10px', borderRadius: 10 }}
                            aria-label="Open mobile navigation"
                        >
                            <Bars3Icon style={{ width: 20, height: 20 }} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                            <CalendarDaysIcon style={{ width: 16, height: 16, color: 'var(--brand-teal)' }} />
                            <span>{todayDate}</span>
                        </div>
                    </div>

                    {/* Right: Theme Toggle & Quick User Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="neu-btn-secondary"
                            style={{
                                padding: '8px 14px',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.82rem',
                            }}
                            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        >
                            {theme === 'light' ? (
                                <>
                                    <MoonIcon style={{ width: 16, height: 16, color: '#58739D' }} />
                                    <span className="hidden sm:inline">Dark</span>
                                </>
                            ) : (
                                <>
                                    <SunIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />
                                    <span className="hidden sm:inline">Light</span>
                                </>
                            )}
                        </button>

                        {/* Top user avatar */}
                        <div
                            className="neu-icon-badge"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--brand-gradient)',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                            }}
                        >
                            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                </header>

                {/* Mobile Drawer */}
                {mobileOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
                        <div
                            onClick={() => setMobileOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                        />
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, boxShadow: '8px 0 24px rgba(0,0,0,0.2)' }}>
                            <div style={{ position: 'absolute', top: 16, right: 14, zIndex: 60 }}>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="neu-btn-secondary"
                                    style={{ padding: 6, borderRadius: '50%' }}
                                >
                                    <XMarkIcon style={{ width: 18, height: 18 }} />
                                </button>
                            </div>
                            <SidebarContent />
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
