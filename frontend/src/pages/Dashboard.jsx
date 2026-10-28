import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ScaleIcon,
    BanknotesIcon,
    SparklesIcon,
    ChevronRightIcon,
    CreditCardIcon,
    ArrowUpRightIcon,
    ArrowDownLeftIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import { NavLink } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

/* ── Currency Formatter ── */
const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n || 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS = [
    '#10BFAE', '#16BCE0', '#A875F5', '#429CF4', '#10A77A',
    '#EBA94B', '#F15B79', '#6366F1', '#EC4899', '#8B5CF6'
];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore((s) => s.user);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [txRes, budgetRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get(`/budgets?month=${currentMonth + 1}&year=${currentYear}`).catch(() => ({ data: [] })),
                ]);
                setTransactions(txRes.data || []);
                setBudgets(budgetRes.data || []);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [currentMonth, currentYear]);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14 }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Loading financial dashboard…</p>
            </div>
        );
    }

    /* ── Metrics Calculations ── */
    const totalIncomeAllTime = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpenseAllTime = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netBalance = totalIncomeAllTime - totalExpenseAllTime;

    const thisMonthTransactions = transactions.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const thisMonthIncome = thisMonthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const thisMonthExpense = thisMonthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const thisMonthSurplus = thisMonthIncome - thisMonthExpense;
    const savingsRate = thisMonthIncome > 0 ? Math.max(0, Math.round((thisMonthSurplus / thisMonthIncome) * 100)) : 0;

    /* ── Category Breakdown for Doughnut Chart ── */
    const categoryTotals = {};
    thisMonthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .forEach((t) => {
            const catName = t.categoryName || 'General';
            categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount || 0);
        });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryValues = Object.values(categoryTotals);

    const doughnutData = {
        labels: categoryLabels.length > 0 ? categoryLabels : ['No Expenses Yet'],
        datasets: [
            {
                data: categoryValues.length > 0 ? categoryValues : [1],
                backgroundColor: categoryLabels.length > 0 ? CATEGORY_COLORS.slice(0, categoryLabels.length) : ['#CBD5E1'],
                borderWidth: 2,
                borderColor: 'var(--bg-surface)',
                hoverOffset: 6,
            },
        ],
    };

    const doughnutOptions = {
        cutout: '72%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'var(--bg-surface)',
                titleColor: 'var(--text-primary)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
                borderWidth: 1,
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)}`,
                },
            },
        },
    };

    /* ── Monthly Spending Trend for Line Chart ── */
    // Last 6 months aggregate
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        last6Months.push({
            month: d.getMonth(),
            year: d.getFullYear(),
            label: MONTH_NAMES[d.getMonth()],
        });
    }

    const trendDataValues = last6Months.map((m) => {
        return transactions
            .filter((t) => {
                if (!t.date) return false;
                const d = new Date(t.date);
                return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'EXPENSE';
            })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    });

    const trendIncomeValues = last6Months.map((m) => {
        return transactions
            .filter((t) => {
                if (!t.date) return false;
                const d = new Date(t.date);
                return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'INCOME';
            })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    });

    const lineChartData = {
        labels: last6Months.map((m) => m.label),
        datasets: [
            {
                label: 'Income',
                data: trendIncomeValues,
                borderColor: '#10BFAE',
                backgroundColor: 'rgba(16, 191, 174, 0.08)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#10BFAE',
                pointRadius: 3,
            },
            {
                label: 'Expenses',
                data: trendDataValues,
                borderColor: '#F15B79',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                borderWidth: 2,
                tension: 0.35,
                pointBackgroundColor: '#F15B79',
                pointRadius: 3,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: 'var(--text-secondary)', font: { size: 12, family: "'Inter', sans-serif" } },
            },
            tooltip: {
                backgroundColor: 'var(--bg-surface)',
                titleColor: 'var(--text-primary)',
                bodyColor: 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
                borderWidth: 1,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'var(--chart-grid)' },
                ticks: { color: 'var(--chart-text)' },
            },
            y: {
                grid: { color: 'var(--chart-grid)' },
                ticks: {
                    color: 'var(--chart-text)',
                    callback: (val) => fmt(val),
                },
            },
        },
    };

    const recentTx = transactions.slice(0, 6);

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* ── Welcome Header ── */}
            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        Welcome back, {user?.firstName || 'User'} 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                        Here is your real-time financial health summary and monthly cash-flow position.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <NavLink to="/transactions" className="neu-btn-primary">
                        <BanknotesIcon style={{ width: 18, height: 18 }} />
                        Add Transaction
                    </NavLink>
                </div>
            </div>

            {/* ── 4 Financial Summary Cards (Soft Neumorphism) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
                {/* Total Balance / Net Position */}
                <div className="neu-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Net Cumulative Balance
                        </span>
                        <div className="neu-icon-badge" style={{ width: 40, height: 40, background: 'rgba(16, 191, 174, 0.12)' }}>
                            <ScaleIcon style={{ width: 20, height: 20, color: 'var(--brand-teal)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: netBalance >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                        {fmt(netBalance)}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="neu-badge neu-badge-teal">Recorded Funds</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Income minus Expenses</span>
                    </div>
                </div>

                {/* Monthly Income */}
                <div className="neu-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            This Month's Income
                        </span>
                        <div className="neu-icon-badge" style={{ width: 40, height: 40, background: 'rgba(16, 167, 122, 0.12)' }}>
                            <ArrowUpRightIcon style={{ width: 20, height: 20, color: 'var(--accent-mint)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-mint)' }}>
                        {fmt(thisMonthIncome)}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="neu-badge neu-badge-success">Inflow</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{MONTH_NAMES[currentMonth]} {currentYear}</span>
                    </div>
                </div>

                {/* Monthly Expenses */}
                <div className="neu-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            This Month's Expenses
                        </span>
                        <div className="neu-icon-badge" style={{ width: 40, height: 40, background: 'rgba(241, 91, 121, 0.12)' }}>
                            <ArrowDownLeftIcon style={{ width: 20, height: 20, color: 'var(--accent-danger)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                        {fmt(thisMonthExpense)}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="neu-badge neu-badge-danger">Outflow</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{MONTH_NAMES[currentMonth]} {currentYear}</span>
                    </div>
                </div>

                {/* Monthly Surplus / Savings */}
                <div className="neu-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Monthly Net Surplus
                        </span>
                        <div className="neu-icon-badge" style={{ width: 40, height: 40, background: 'rgba(66, 156, 244, 0.12)' }}>
                            <ShieldCheckIcon style={{ width: 20, height: 20, color: 'var(--accent-sky)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: thisMonthSurplus >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                        {thisMonthSurplus >= 0 ? '+' : ''}{fmt(thisMonthSurplus)}
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="neu-badge neu-badge-sky">{savingsRate}% Saved</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Retention velocity</span>
                    </div>
                </div>
            </div>

            {/* ── Middle Section: Spending Breakdown & Trends ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
                {/* Spending Overview (Doughnut & Categories) */}
                <div className="neu-card-flat" style={{ padding: 26, borderRadius: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Spending Breakdown
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Category allocation for {MONTH_NAMES[currentMonth]} {currentYear}
                            </p>
                        </div>
                        <span className="neu-badge neu-badge-teal">
                            Total: {fmt(thisMonthExpense)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 200, marginBottom: 20 }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                                Expenses
                            </span>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {fmt(thisMonthExpense)}
                            </span>
                        </div>
                    </div>

                    {/* Category List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                        {categoryLabels.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem', padding: '16px 0' }}>
                                No expenses logged this month yet.
                            </p>
                        ) : (
                            categoryLabels.map((cat, idx) => {
                                const val = categoryValues[idx];
                                const pct = thisMonthExpense > 0 ? Math.round((val / thisMonthExpense) * 100) : 0;
                                return (
                                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {cat}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {fmt(val)}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 6-Month Cash Flow Velocity Trend (Line Chart) */}
                <div className="neu-card-flat" style={{ padding: 26, borderRadius: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                6-Month Cash Flow Trend
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Comparing historical monthly income vs. expenditure
                            </p>
                        </div>
                    </div>

                    <div style={{ height: 260, width: '100%' }}>
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>
            </div>

            {/* ── LifeLens Simulator Feature Card & Budgets Progress ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 32 }}>
                {/* LifeLens Feature Card */}
                <div
                    className="neu-card"
                    style={{
                        padding: 26,
                        background: 'linear-gradient(135deg, rgba(16, 191, 174, 0.08), rgba(22, 188, 224, 0.12))',
                        border: '1px solid rgba(16, 191, 174, 0.28)',
                        borderRadius: 22,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div className="neu-icon-badge" style={{ width: 38, height: 38, background: 'var(--brand-gradient)', color: '#FFFFFF' }}>
                                <SparklesIcon style={{ width: 20, height: 20 }} />
                            </div>
                            <span className="neu-badge neu-badge-teal">Decision Intelligence</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                            LifeLens™ What-If Simulator
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: 18 }}>
                            Wondering if you can afford that laptop, vacation, or new monthly commitment? Simulate the exact month-by-month financial impact against your real cash flow before spending.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <NavLink to="/lifelens" className="neu-btn-primary" style={{ padding: '10px 20px', fontSize: '0.84rem' }}>
                            Launch Simulator ↗
                        </NavLink>
                    </div>
                </div>

                {/* Monthly Budgets Snapshot */}
                <div className="neu-card-flat" style={{ padding: 26, borderRadius: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Monthly Budget Limits
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {MONTH_NAMES[currentMonth]} {currentYear} Progress
                            </p>
                        </div>
                        <NavLink to="/budgets" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-teal)', textDecoration: 'none' }}>
                            Manage →
                        </NavLink>
                    </div>

                    {budgets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                            <CreditCardIcon style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.84rem' }}>No budgets set for this month.</p>
                            <NavLink to="/budgets" style={{ color: 'var(--brand-teal)', fontSize: '0.78rem', fontWeight: 600 }}>
                                Set monthly limits
                            </NavLink>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {budgets.slice(0, 3).map((b) => {
                                const spent = categoryTotals[b.categoryName] || 0;
                                const limit = Number(b.amount || 0);
                                const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                                const isExceeded = spent > limit;

                                return (
                                    <div key={b.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {b.categoryName}
                                            </span>
                                            <span style={{ color: isExceeded ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                                                {fmt(spent)} / {fmt(limit)}
                                            </span>
                                        </div>
                                        <div className="neu-progress-bg" style={{ height: 8 }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${pct}%`,
                                                    background: isExceeded
                                                        ? 'var(--accent-danger)'
                                                        : pct >= 80
                                                        ? 'var(--accent-warning)'
                                                        : 'var(--brand-gradient)',
                                                    borderRadius: 9999,
                                                    transition: 'width 0.4s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Recent Transactions Table (Soft Neumorphic) ── */}
            <div className="neu-card-flat" style={{ padding: 26, borderRadius: 22, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Recent Transactions
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Latest ledger activities across all categories
                        </p>
                    </div>
                    <NavLink to="/transactions" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-teal)', textDecoration: 'none' }}>
                        View All ({transactions.length}) →
                    </NavLink>
                </div>

                {recentTx.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '0.88rem' }}>No transactions recorded yet.</p>
                        <NavLink to="/transactions" className="neu-btn-primary" style={{ marginTop: 12, padding: '8px 18px', fontSize: '0.82rem' }}>
                            Add Your First Transaction
                        </NavLink>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="neu-table">
                            <thead>
                                <tr>
                                    <th>Description / Category</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {tx.description || tx.categoryName || 'Transaction'}
                                            </div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {tx.categoryName}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {tx.date}
                                        </td>
                                        <td>
                                            <span className={`neu-badge ${tx.type === 'INCOME' ? 'neu-badge-success' : 'neu-badge-danger'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'INCOME' ? 'var(--accent-mint)' : 'var(--accent-danger)' }}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
