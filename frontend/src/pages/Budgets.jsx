import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
];

/* Progress bar color logic */
const barColor = (pct) => {
    if (pct >= 100) return 'linear-gradient(90deg,#ef4444,#f97316)';
    if (pct >= 75)  return 'linear-gradient(90deg,#f59e0b,#f97316)';
    return             'linear-gradient(90deg,#14b8a6,#38bdf8)';
};

const Budgets = () => {
    const [budgets,    setBudgets]    = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading,    setLoading]    = useState(true);

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year,  setYear]  = useState(now.getFullYear());

    const [formData, setFormData] = useState({ categoryId: '', amount: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Load categories first (crucial for the form)
            try {
                const catRes = await api.get('/categories');
                setCategories(catRes.data.filter((c) => c.type === 'EXPENSE'));
            } catch (err) {
                console.error('Error loading categories:', err);
                toast.error('Failed to load categories');
            }

            // Load budgets and transactions
            try {
                const [budgetsRes, txRes] = await Promise.all([
                    api.get(`/budgets?month=${month}&year=${year}`),
                    api.get('/transactions'),
                ]);
                setBudgets(budgetsRes.data);
                setTransactions(txRes.data);
            } catch (err) {
                console.error('Error loading budgets/transactions:', err);
                toast.error('Failed to load budget data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [month, year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', {
                categoryId: Number(formData.categoryId),
                amount:     Number(formData.amount),
                month,
                year,
            });
            toast.success('Budget saved! 💾');
            fetchData();
            setFormData({ categoryId: '', amount: '' });
        } catch {
            toast.error('Error saving budget');
        }
    };

    /* Calculate spending per category for the selected month/year */
    const spentByCategory = {};
    transactions
        .filter((t) => {
            const d = new Date(t.date);
            return (
                t.type === 'EXPENSE' &&
                d.getMonth() + 1 === month &&
                d.getFullYear() === year
            );
        })
        .forEach((t) => {
            spentByCategory[t.categoryName] =
                (spentByCategory[t.categoryName] || 0) + Number(t.amount);
        });

    /* Month navigation */
    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear((y) => y - 1); }
        else setMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear((y) => y + 1); }
        else setMonth((m) => m + 1);
    };

    const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent    = budgets.reduce((s, b) => s + (spentByCategory[b.categoryName] || 0), 0);
    const overBudget    = budgets.filter((b) => (spentByCategory[b.categoryName] || 0) >= Number(b.amount));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Page header */}
            <div>
                <h1 className="section-header">Monthly Budgets</h1>
                <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: 4 }}>
                    Set spending limits and track your progress
                </p>
            </div>

            {/* Month / Year selector */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px',
                borderRadius: 14,
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
                flexWrap: 'wrap', gap: 12,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        onClick={prevMonth}
                        style={{
                            width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronLeftIcon style={{ width: 16, height: 16 }} />
                    </button>
                    <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9',
                        minWidth: 160, textAlign: 'center',
                    }}>
                        {MONTH_NAMES[month - 1]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        style={{
                            width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.04)', cursor: 'pointer', color: '#94a3b8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronRightIcon style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Summary pills */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Budgeted', value: fmt(totalBudgeted), color: '#38bdf8' },
                        { label: 'Spent',    value: fmt(totalSpent),    color: totalSpent > totalBudgeted ? '#f87171' : '#4ade80' },
                        { label: 'Over Budget', value: overBudget.length, color: '#f87171' },
                    ].map((s) => (
                        <div key={s.label} style={{
                            padding: '6px 16px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#475569' }}>{s.label}: </span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 20, alignItems: 'start' }}
                 className="budget-grid">
                {/* Set Budget Form */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(20,184,166,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <PlusIcon style={{ width: 16, height: 16, color: '#2dd4bf' }} />
                        </div>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
                            Set Category Budget
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div>
                            <label className="form-label">Category</label>
                            <select
                                id="budget-category"
                                required
                                className="input-dark"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select expense category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">Budget Limit (₹)</label>
                            <input
                                id="budget-amount"
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                className="input-dark"
                                placeholder="Enter amount"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        <button
                            id="budget-submit"
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%' }}
                        >
                            <PlusIcon style={{ width: 15, height: 15 }} />
                            Save Budget
                        </button>
                    </form>

                    {/* Helper text */}
                    <div style={{
                        marginTop: 20, padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(20,184,166,0.06)',
                        border: '1px solid rgba(20,184,166,0.12)',
                    }}>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                            💡 Setting a budget for an existing category will update it. Budgets reset each month.
                        </p>
                    </div>
                </div>

                {/* Budget list with progress bars */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 20 }}>
                        {MONTH_NAMES[month - 1]} Budget Tracker
                    </h2>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                            <div className="spinner" />
                        </div>
                    ) : budgets.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '48px 24px',
                            border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12,
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
                            <p style={{ color: '#475569', fontSize: '0.9rem' }}>
                                No budgets set for {MONTH_NAMES[month - 1]} {year}
                            </p>
                            <p style={{ color: '#334155', fontSize: '0.8rem', marginTop: 4 }}>
                                Use the form to add your first budget
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {budgets.map((budget) => {
                                const spent   = spentByCategory[budget.categoryName] || 0;
                                const limit   = Number(budget.amount);
                                const pct     = Math.min((spent / limit) * 100, 100);
                                const isOver  = spent >= limit;
                                const remaining = Math.max(limit - spent, 0);

                                return (
                                    <div
                                        key={budget.id}
                                        style={{
                                            padding: '18px 20px',
                                            borderRadius: 12,
                                            background: 'rgba(255,255,255,0.025)',
                                            border: `1px solid ${isOver ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {/* Category + amounts */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                            <div>
                                                <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                                                    {budget.categoryName}
                                                </p>
                                                <p style={{ fontSize: '0.76rem', color: '#475569' }}>
                                                    {fmt(spent)} spent of {fmt(limit)}
                                                </p>
                                            </div>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.78rem', fontWeight: 700,
                                                        padding: '3px 10px', borderRadius: 20,
                                                        background: isOver ? 'rgba(239,68,68,0.12)' : 'rgba(20,184,166,0.1)',
                                                        color: isOver ? '#f87171' : '#2dd4bf',
                                                        border: `1px solid ${isOver ? 'rgba(239,68,68,0.25)' : 'rgba(20,184,166,0.2)'}`,
                                                    }}>
                                                        {isOver ? '⚠ Over budget' : `${fmt(remaining)} left`}
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Delete this budget?')) {
                                                                try {
                                                                    await api.delete(`/budgets/${budget.id}`);
                                                                    toast.success('Budget deleted');
                                                                    fetchData();
                                                                } catch {
                                                                    toast.error('Failed to delete budget');
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'transparent', border: 'none', color: '#475569',
                                                            cursor: 'pointer', padding: 4, borderRadius: 6,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseOut={(e) => e.currentTarget.style.color = '#475569'}
                                                    >
                                                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="budget-bar-track">
                                            <div
                                                className="budget-bar-fill"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: barColor(pct),
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                            <span style={{ fontSize: '0.7rem', color: '#334155' }}>0%</span>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 600,
                                                color: isOver ? '#f87171' : '#64748b',
                                            }}>
                                                {pct.toFixed(0)}%
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: '#334155' }}>100%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Budgets;
