import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CreditCardIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n || 0);

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const [formData, setFormData] = useState({ categoryId: '', amount: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, budgetsRes, txRes] = await Promise.all([
                api.get('/categories'),
                api.get(`/budgets?month=${month}&year=${year}`),
                api.get('/transactions'),
            ]);
            setCategories(catRes.data.filter((c) => c.type === 'EXPENSE'));
            setBudgets(budgetsRes.data || []);
            setTransactions(txRes.data || []);
        } catch (err) {
            console.error('Error loading budget data:', err);
            toast.error('Failed to load budget data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) {
            toast.error('Please select an expense category');
            return;
        }
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast.error('Enter a valid budget limit');
            return;
        }

        try {
            await api.post('/budgets', {
                categoryId: Number(formData.categoryId),
                amount: Number(formData.amount),
                month,
                year,
            });
            toast.success('Budget limit set successfully! 💾');
            fetchData();
            setFormData({ categoryId: '', amount: '' });
        } catch {
            toast.error('Error saving budget');
        }
    };

    const handleDeleteBudget = async (id, catName) => {
        if (!window.confirm(`Remove budget limit for ${catName}?`)) return;
        try {
            await api.delete(`/budgets/${id}`);
            toast.success('Budget limit removed');
            fetchData();
        } catch {
            toast.error('Failed to delete budget');
        }
    };

    const prevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear((y) => y - 1);
        } else {
            setMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear((y) => y + 1);
        } else {
            setMonth((m) => m + 1);
        }
    };

    /* Spending per category for active month */
    const spentByCategory = {};
    transactions
        .filter((t) => {
            if (!t.date) return false;
            const d = new Date(t.date);
            return (
                t.type === 'EXPENSE' &&
                d.getMonth() + 1 === month &&
                d.getFullYear() === year
            );
        })
        .forEach((t) => {
            spentByCategory[t.categoryName] =
                (spentByCategory[t.categoryName] || 0) + Number(t.amount || 0);
        });

    const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (spentByCategory[b.categoryName] || 0), 0);
    const overBudgetList = budgets.filter((b) => (spentByCategory[b.categoryName] || 0) > Number(b.amount || 0));

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 14 }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading monthly budgets…</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Monthly Spending Budgets
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    Define planned ceilings per category and monitor real-time threshold progress.
                </p>
            </div>

            {/* Month Navigator & Summary Bar */}
            <div
                className="neu-card-flat"
                style={{
                    padding: '16px 24px',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                }}
            >
                {/* Month Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={prevMonth}
                        className="neu-btn-secondary"
                        style={{ padding: '8px 12px', borderRadius: 12 }}
                        aria-label="Previous Month"
                    >
                        <ChevronLeftIcon style={{ width: 16, height: 16 }} />
                    </button>
                    <span
                        className="font-heading"
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            minWidth: 180,
                            textAlign: 'center',
                        }}
                    >
                        {MONTH_NAMES[month - 1]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="neu-btn-secondary"
                        style={{ padding: '8px 12px', borderRadius: 12 }}
                        aria-label="Next Month"
                    >
                        <ChevronRightIcon style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Summary Badges */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Budgeted:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-teal)' }}>{fmt(totalBudgeted)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spent:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: totalSpent > totalBudgeted ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                            {fmt(totalSpent)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Breached:</span>
                        <span className={`neu-badge ${overBudgetList.length > 0 ? 'neu-badge-danger' : 'neu-badge-success'}`}>
                            {overBudgetList.length} Categories
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid: Set Budget Form (Left) & Budget Cards (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>
                {/* Form: Set Category Budget */}
                <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div className="neu-icon-badge" style={{ width: 36, height: 36, background: 'rgba(16, 191, 174, 0.12)' }}>
                            <CreditCardIcon style={{ width: 18, height: 18, color: 'var(--brand-teal)' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Set Category Limit
                            </h2>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                Allocate maximum monthly spending for {MONTH_NAMES[month - 1]}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Category *
                            </label>
                            <select
                                id="budget-category"
                                required
                                className="neu-input"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Expense Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon || '🏷️'} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Monthly Limit (₹) *
                            </label>
                            <input
                                id="budget-amount"
                                type="number"
                                required
                                min="1"
                                className="neu-input"
                                placeholder="e.g. 15000"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        <button id="budget-submit" type="submit" className="neu-btn-primary" style={{ marginTop: 6 }}>
                            <PlusIcon style={{ width: 16, height: 16 }} />
                            Save Budget Limit
                        </button>
                    </form>
                </div>

                {/* Right: Active Category Budget Progress Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Active Category Ceilings ({budgets.length})
                        </h2>
                    </div>

                    {budgets.length === 0 ? (
                        <div className="neu-card-flat" style={{ padding: 40, textAlign: 'center', borderRadius: 20 }}>
                            <CreditCardIcon style={{ width: 40, height: 40, margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No budgets set</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 300, margin: '4px auto 0' }}>
                                Use the form on the left to set spending limits for {MONTH_NAMES[month - 1]} {year}.
                            </p>
                        </div>
                    ) : (
                        budgets.map((b) => {
                            const spent = spentByCategory[b.categoryName] || 0;
                            const limit = Number(b.amount || 0);
                            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                            const isExceeded = spent > limit;
                            const remaining = limit - spent;

                            return (
                                <div key={b.id} className="neu-card" style={{ padding: 20, borderRadius: 18 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.1rem' }}>{b.categoryIcon || '🏷️'}</span>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {b.categoryName}
                                                </h3>
                                            </div>
                                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                                                {isExceeded ? (
                                                    <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>
                                                        Over budget by {fmt(Math.abs(remaining))}
                                                    </span>
                                                ) : (
                                                    <span>{fmt(remaining)} remaining</span>
                                                )}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span className={`neu-badge ${isExceeded ? 'neu-badge-danger' : pct >= 80 ? 'neu-badge-warning' : 'neu-badge-teal'}`}>
                                                {pct}%
                                            </span>
                                            <button
                                                className="neu-btn-danger"
                                                onClick={() => handleDeleteBudget(b.id, b.categoryName)}
                                                title="Delete budget"
                                            >
                                                <TrashIcon style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="neu-progress-bg" style={{ height: 10, marginBottom: 8 }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${Math.min(100, pct)}%`,
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

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <span>Spent: <strong>{fmt(spent)}</strong></span>
                                        <span>Limit: <strong>{fmt(limit)}</strong></span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Budgets;
