import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { PlusIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories,   setCategories]   = useState([]);
    const [loading,      setLoading]       = useState(true);
    const [filterType,   setFilterType]   = useState('ALL');

    const [formData, setFormData] = useState({
        amount:      '',
        categoryId:  '',
        type:        'EXPENSE',
        date:        format(new Date(), 'yyyy-MM-dd'),
        description: '',
    });

    const fetchData = async () => {
        try {
            const [txRes, catRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/categories'),
            ]);
            setTransactions(txRes.data);
            setCategories(catRes.data);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) { toast.error('Please select a category'); return; }
        if (!formData.amount || Number(formData.amount) <= 0) { toast.error('Enter a valid amount'); return; }
        try {
            const payload = {
                ...formData,
                categoryId: Number(formData.categoryId),
                amount: Number(formData.amount),
            };
            await api.post('/transactions', payload);
            toast.success('Transaction added! ✅');
            fetchData();
            setFormData(prev => ({ ...prev, amount: '', description: '', categoryId: '' }));
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to add transaction';
            toast.error(msg);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/transactions/${id}`);
            toast.success('Transaction deleted');
            setTransactions((prev) => prev.filter((t) => t.id !== id));
        } catch {
            toast.error('Error deleting transaction');
        }
    };

    const filteredCats = categories.filter((c) => c.type === formData.type);
    const filteredTx   = filterType === 'ALL'
        ? transactions
        : transactions.filter((t) => t.type === filterType);

    const totals = {
        income:  transactions.filter((t) => t.type === 'INCOME').reduce((s, c) => s + Number(c.amount), 0),
        expense: transactions.filter((t) => t.type === 'EXPENSE').reduce((s, c) => s + Number(c.amount), 0),
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
                <div className="spinner" />
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>Loading transactions…</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div>
                <h1 className="section-header">Transactions</h1>
                <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: 4 }}>
                    Manage all your income and expense records
                </p>
            </div>

            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total Records', value: transactions.length, color: '#94a3b8', sub: 'transactions' },
                    { label: 'Total Income', value: fmt(totals.income), color: '#4ade80', sub: 'all time' },
                    { label: 'Total Expenses', value: fmt(totals.expense), color: '#f87171', sub: 'all time' },
                ].map((s) => (
                    <div key={s.label} style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <p style={{ fontSize: '0.72rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
                        <p style={{ fontSize: '0.7rem', color: '#334155', marginTop: 2 }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Add Transaction Form */}
            <div className="glass-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlusIcon style={{ width: 16, height: 16, color: '#2dd4bf' }} />
                    </div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Add New Transaction</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
                        {/* Type */}
                        <div>
                            <label className="form-label">Type</label>
                            <select
                                id="tx-type"
                                className="input-dark"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
                            >
                                <option value="EXPENSE">Expense</option>
                                <option value="INCOME">Income</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="form-label">Category</label>
                            <select
                                id="tx-category"
                                required
                                className="input-dark"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {filteredCats.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="form-label">Amount (₹)</label>
                            <input
                                id="tx-amount"
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                className="input-dark"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="form-label">Date</label>
                            <input
                                id="tx-date"
                                type="date"
                                required
                                className="input-dark"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Description (optional)</label>
                            <input
                                id="tx-description"
                                type="text"
                                className="input-dark"
                                placeholder="Brief note…"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        id="tx-submit"
                        type="submit"
                        className="btn-primary"
                        style={{ paddingLeft: 28, paddingRight: 28 }}
                    >
                        <PlusIcon style={{ width: 16, height: 16 }} />
                        Add Transaction
                    </button>
                </form>
            </div>

            {/* Transactions Table */}
            <div className="glass-card" style={{ padding: 24 }}>
                {/* Table header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
                        All Transactions{' '}
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 400 }}>({filteredTx.length})</span>
                    </h2>
                    {/* Filter buttons */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <FunnelIcon style={{ width: 14, height: 14, color: '#475569' }} />
                        {['ALL', 'INCOME', 'EXPENSE'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: 8,
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    transition: 'all 0.2s ease',
                                    background: filterType === t ? (t === 'INCOME' ? 'rgba(34,197,94,0.15)' : t === 'EXPENSE' ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)') : 'transparent',
                                    borderColor: filterType === t ? (t === 'INCOME' ? 'rgba(34,197,94,0.3)' : t === 'EXPENSE' ? 'rgba(239,68,68,0.3)' : 'rgba(20,184,166,0.3)') : 'rgba(255,255,255,0.06)',
                                    color: filterType === t ? (t === 'INCOME' ? '#4ade80' : t === 'EXPENSE' ? '#f87171' : '#2dd4bf') : '#64748b',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTx.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{tx.date}</td>
                                    <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{tx.categoryName}</td>
                                    <td>
                                        <span className={tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b' }}>{tx.description || '—'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', color: tx.type === 'INCOME' ? '#4ade80' : '#f87171' }}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn-danger"
                                            onClick={() => handleDelete(tx.id)}
                                            title="Delete transaction"
                                        >
                                            <TrashIcon style={{ width: 13, height: 13 }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTx.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
                                        No transactions found
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
