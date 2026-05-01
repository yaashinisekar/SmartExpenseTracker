import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, ArcElement,
    Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ScaleIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

/* ─── Helpers ─── */
const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon: Icon, gradient, glow, delay = 0 }) => (
    <div
        className="animate-fade-in-up"
        style={{
            animationDelay: `${delay}ms`,
            padding: '24px',
            borderRadius: 16,
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        {/* top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: gradient }} />
        {/* glow blob */}
        <div style={{
            position: 'absolute', top: -30, right: -30, width: 120, height: 120,
            borderRadius: '50%', background: glow, filter: 'blur(40px)', opacity: 0.4,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    {label}
                </p>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                    {value}
                </p>
            </div>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon style={{ width: 22, height: 22, color: '#94a3b8' }} />
            </div>
        </div>
    </div>
);

/* ─── Dashboard ─── */
const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading]           = useState(true);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/transactions');
                setTransactions(data);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
                <div className="spinner" />
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>Loading dashboard…</p>
            </div>
        );
    }

    const now          = new Date();
    const currentMonth = now.getMonth();
    const currentYear  = now.getFullYear();

    const thisMonthTx  = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIncome  = thisMonthTx.filter((t) => t.type === 'INCOME').reduce((s, c) => s + Number(c.amount), 0);
    const totalExpense = thisMonthTx.filter((t) => t.type === 'EXPENSE').reduce((s, c) => s + Number(c.amount), 0);
    const balance      = totalIncome - totalExpense;

    /* Doughnut */
    const expByCat = {};
    thisMonthTx.filter((t) => t.type === 'EXPENSE').forEach((t) => {
        expByCat[t.categoryName] = (expByCat[t.categoryName] || 0) + Number(t.amount);
    });
    const COLORS = ['#14b8a6','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#64748b'];
    const pieData = {
        labels: Object.keys(expByCat),
        datasets: [{
            data: Object.values(expByCat),
            backgroundColor: COLORS,
            borderColor: '#0a0f1e',
            borderWidth: 2,
        }],
    };

    /* Line – last 30 days */
    const last30 = [...Array(30)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
    });

    const trendIncome  = last30.map((date) =>
        transactions.filter((t) => t.date === date && t.type === 'INCOME').reduce((s, c) => s + Number(c.amount), 0));
    const trendExpense = last30.map((date) =>
        transactions.filter((t) => t.date === date && t.type === 'EXPENSE').reduce((s, c) => s + Number(c.amount), 0));

    const lineData = {
        labels: last30.map((d) => d.slice(5)),
        datasets: [
            {
                label: 'Income',
                data: trendIncome,
                borderColor: '#14b8a6',
                backgroundColor: 'rgba(20,184,166,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            },
            {
                label: 'Expense',
                data: trendExpense,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.06)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: {
                    color: '#64748b',
                    font: { size: 12 },
                    boxWidth: 12,
                    usePointStyle: true,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                titleColor: '#94a3b8',
                bodyColor: '#e2e8f0',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                ticks: { color: '#475569', font: { size: 11 } },
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: '#475569',
                    font: { size: 10 },
                    maxTicksLimit: 10,
                },
            },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#64748b', font: { size: 11 }, padding: 12, boxWidth: 12, usePointStyle: true },
            },
            tooltip: {
                backgroundColor: 'rgba(15,23,42,0.95)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                bodyColor: '#e2e8f0',
            },
        },
    };

    /* Recent transactions (last 5) */
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="section-header">Dashboard</h1>
                    <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: 4 }}>
                        Hello, {user?.firstName}! Here's your financial overview.
                    </p>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#64748b', fontSize: '0.82rem',
                }}>
                    <CalendarDaysIcon style={{ width: 15, height: 15 }} />
                    {MONTH_NAMES[currentMonth]} {currentYear}
                </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <StatCard
                    label="Net Balance"
                    value={fmt(balance)}
                    icon={ScaleIcon}
                    gradient={balance >= 0 ? 'linear-gradient(90deg,#14b8a6,#38bdf8)' : 'linear-gradient(90deg,#ef4444,#f97316)'}
                    glow={balance >= 0 ? 'rgba(20,184,166,0.4)' : 'rgba(239,68,68,0.4)'}
                    delay={0}
                />
                <StatCard
                    label="Total Income"
                    value={fmt(totalIncome)}
                    icon={ArrowTrendingUpIcon}
                    gradient="linear-gradient(90deg,#22c55e,#14b8a6)"
                    glow="rgba(34,197,94,0.4)"
                    delay={80}
                />
                <StatCard
                    label="Total Expenses"
                    value={fmt(totalExpense)}
                    icon={ArrowTrendingDownIcon}
                    gradient="linear-gradient(90deg,#ef4444,#f97316)"
                    glow="rgba(239,68,68,0.4)"
                    delay={160}
                />
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20 }} className="chart-grid">
                {/* Line chart */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>
                        30-Day Cash Flow
                    </h2>
                    <div style={{ height: 240 }}>
                        <Line data={lineData} options={lineOptions} />
                    </div>
                </div>

                {/* Doughnut */}
                <div className="glass-card" style={{ padding: 24, minWidth: 240 }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>
                        Expense Breakdown
                    </h2>
                    <div style={{ height: 220 }}>
                        {Object.keys(expByCat).length > 0 ? (
                            <Doughnut data={pieData} options={pieOptions} />
                        ) : (
                            <div style={{
                                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column', gap: 8, color: '#334155',
                            }}>
                                <div style={{ fontSize: '2rem' }}>🎉</div>
                                <p style={{ fontSize: '0.82rem', textAlign: 'center' }}>No expenses this month</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent transactions */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 18 }}>
                    Recent Transactions
                </h2>
                {recent.length === 0 ? (
                    <p style={{ color: '#334155', textAlign: 'center', padding: '32px 0', fontSize: '0.88rem' }}>
                        No transactions yet. Add one to get started!
                    </p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ color: '#64748b' }}>{tx.date}</td>
                                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{tx.categoryName}</td>
                                    <td style={{ color: '#64748b' }}>{tx.description || '—'}</td>
                                    <td>
                                        <span className={tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'INCOME' ? '#4ade80' : '#f87171' }}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
