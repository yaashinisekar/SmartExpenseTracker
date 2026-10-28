import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    PlusIcon,
    TrashIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    BanknotesIcon,
    ArrowUpRightIcon,
    ArrowDownLeftIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n || 0);

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        categoryId: '',
        type: 'EXPENSE',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
    });

    const fetchData = async () => {
        try {
            const [txRes, catRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/categories'),
            ]);
            setTransactions(txRes.data || []);
            setCategories(catRes.data || []);
        } catch {
            toast.error('Failed to load transaction data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) {
            toast.error('Please select a category');
            return;
        }
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }

        try {
            const payload = {
                ...formData,
                categoryId: Number(formData.categoryId),
                amount: Number(formData.amount),
            };
            await api.post('/transactions', payload);
            toast.success('Transaction logged successfully! ✅');
            fetchData();
            setFormData((prev) => ({
                ...prev,
                amount: '',
                description: '',
                categoryId: '',
            }));
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to add transaction';
            toast.error(msg);
        }
    };

    const handleDelete = async (id, desc) => {
        if (!window.confirm(`Delete transaction "${desc || 'Record'}"?`)) return;
        try {
            await api.delete(`/transactions/${id}`);
            toast.success('Transaction deleted');
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch {
            toast.error('Error deleting transaction');
        }
    };

    const filteredCats = categories.filter((c) => c.type === formData.type);

    const filteredTx = transactions
        .filter((t) => {
            if (filterType !== 'ALL' && t.type !== filterType) return false;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const desc = (t.description || '').toLowerCase();
                const cat = (t.categoryName || '').toLowerCase();
                return desc.includes(term) || cat.includes(term);
            }
            return true;
        });

    const totalIncome = transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 14 }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading transactions…</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Transactions Ledger
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    Track, filter, and manage all incoming and outgoing personal cash flows.
                </p>
            </div>

            {/* Summary KPI Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {/* Total Records */}
                <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Total Records
                        </span>
                        <div className="neu-icon-badge" style={{ width: 34, height: 34, background: 'rgba(66, 156, 244, 0.12)' }}>
                            <DocumentTextIcon style={{ width: 18, height: 18, color: 'var(--accent-sky)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {transactions.length}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical entries</span>
                </div>

                {/* Total Income */}
                <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Total Inflows
                        </span>
                        <div className="neu-icon-badge" style={{ width: 34, height: 34, background: 'rgba(16, 167, 122, 0.12)' }}>
                            <ArrowUpRightIcon style={{ width: 18, height: 18, color: 'var(--accent-mint)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-mint)' }}>
                        {fmt(totalIncome)}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cumulative earnings</span>
                </div>

                {/* Total Expenses */}
                <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Total Outflows
                        </span>
                        <div className="neu-icon-badge" style={{ width: 34, height: 34, background: 'rgba(241, 91, 121, 0.12)' }}>
                            <ArrowDownLeftIcon style={{ width: 18, height: 18, color: 'var(--accent-danger)' }} />
                        </div>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-danger)' }}>
                        {fmt(totalExpense)}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cumulative spending</span>
                </div>
            </div>

            {/* Add Transaction Form (Soft Neumorphic Card) */}
            <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div className="neu-icon-badge" style={{ width: 36, height: 36, background: 'rgba(16, 191, 174, 0.12)' }}>
                        <PlusIcon style={{ width: 18, height: 18, color: 'var(--brand-teal)' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Record New Transaction
                        </h2>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Select category, type, and amount to instantly log to your financial ledger
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 16 }}>
                        {/* Type Toggle */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Type
                            </label>
                            <select
                                id="tx-type"
                                className="neu-input"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
                            >
                                <option value="EXPENSE">Expense (Outflow)</option>
                                <option value="INCOME">Income (Inflow)</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Category *
                            </label>
                            <select
                                id="tx-category"
                                required
                                className="neu-input"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {filteredCats.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon || '🏷️'} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Amount (₹) *
                            </label>
                            <input
                                id="tx-amount"
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                className="neu-input"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Date *
                            </label>
                            <input
                                id="tx-date"
                                type="date"
                                required
                                className="neu-input"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Description / Notes
                            </label>
                            <input
                                id="tx-description"
                                type="text"
                                className="neu-input"
                                placeholder="e.g. Grocery shopping, Client invoice, Dinner"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <button id="tx-submit" type="submit" className="neu-btn-primary">
                        <PlusIcon style={{ width: 16, height: 16 }} />
                        Add Transaction
                    </button>
                </form>
            </div>

            {/* Transactions Table & Filter Toolbar */}
            <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Transaction Records
                        </h2>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Showing {filteredTx.length} of {transactions.length} entries
                        </span>
                    </div>

                    {/* Search & Type Filters */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', width: 220 }}>
                            <MagnifyingGlassIcon style={{ width: 16, height: 16, color: 'var(--text-muted)', position: 'absolute', left: 12, top: 11 }} />
                            <input
                                type="text"
                                className="neu-input"
                                placeholder="Search note / category…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: '0.82rem' }}
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface-secondary)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                            {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 8,
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: 'none',
                                        transition: 'all 0.2s',
                                        background: filterType === t ? 'var(--brand-gradient)' : 'transparent',
                                        color: filterType === t ? '#FFFFFF' : 'var(--text-secondary)',
                                        boxShadow: filterType === t ? '0 2px 8px rgba(16, 191, 174, 0.3)' : 'none',
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="neu-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTx.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {tx.date}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '1rem' }}>{tx.categoryIcon || '🏷️'}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {tx.categoryName}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {tx.description || '—'}
                                    </td>
                                    <td>
                                        <span className={`neu-badge ${tx.type === 'INCOME' ? 'neu-badge-success' : 'neu-badge-danger'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: tx.type === 'INCOME' ? 'var(--accent-mint)' : 'var(--accent-danger)' }}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="neu-btn-danger"
                                            onClick={() => handleDelete(tx.id, tx.description)}
                                            title="Delete transaction"
                                        >
                                            <TrashIcon style={{ width: 14, height: 14 }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTx.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                        No matching transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
