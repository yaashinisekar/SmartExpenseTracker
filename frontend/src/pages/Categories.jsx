import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ICONS = ['🍔','🚗','🏠','🎬','💊','📚','✈️','🛍️','💡','🎮','🐾','🎓','💼','💻','📈','🏦','💰','🏋️'];

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [editingId, setEditingId]   = useState(null);
    const [editName, setEditName]     = useState('');
    const [editIcon, setEditIcon]     = useState('');

    const [form, setForm] = useState({ name: '', type: 'EXPENSE', icon: '🍔' });

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Category name is required'); return; }
        try {
            await api.post('/categories', form);
            toast.success('Category added! ✅');
            setForm({ name: '', type: 'EXPENSE', icon: '🍔' });
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to add category');
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditIcon(cat.icon || '🏷️');
    };

    const cancelEdit = () => { setEditingId(null); setEditName(''); setEditIcon(''); };

    const saveEdit = async (cat) => {
        if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
        try {
            await api.put(`/categories/${cat.id}`, { name: editName, type: cat.type, icon: editIcon });
            toast.success('Category updated!');
            cancelEdit();
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category? Transactions using it may be affected.')) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted');
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cannot delete this category');
        }
    };

    const expense = categories.filter(c => c.type === 'EXPENSE');
    const income  = categories.filter(c => c.type === 'INCOME');

    const CategoryCard = ({ cat }) => (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.2s ease',
        }}>
            {editingId === cat.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <select
                        value={editIcon}
                        onChange={e => setEditIcon(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', color: '#e2e8f0', fontSize: '1rem' }}
                    >
                        {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="input-dark"
                        style={{ flex: 1, padding: '8px 12px' }}
                        autoFocus
                    />
                    <button onClick={() => saveEdit(cat)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#4ade80' }}>
                        <CheckIcon style={{ width: 14, height: 14 }} />
                    </button>
                    <button onClick={cancelEdit} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#f87171' }}>
                        <XMarkIcon style={{ width: 14, height: 14 }} />
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1.4rem' }}>{cat.icon || '🏷️'}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#cbd5e1' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(cat)} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#38bdf8' }}>
                            <PencilIcon style={{ width: 13, height: 13 }} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="btn-danger">
                            <TrashIcon style={{ width: 13, height: 13 }} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div>
                <h1 className="section-header">Categories</h1>
                <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: 4 }}>
                    Manage your income and expense categories
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.8fr)', gap: 20, alignItems: 'start' }} className="budget-grid">
                {/* Add Form */}
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlusIcon style={{ width: 16, height: 16, color: '#2dd4bf' }} />
                        </div>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>Add Category</h2>
                    </div>

                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="form-label">Type</label>
                            <select id="cat-type" className="input-dark" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="EXPENSE">Expense</option>
                                <option value="INCOME">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Name</label>
                            <input id="cat-name" type="text" required className="input-dark" placeholder="e.g. Groceries" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Icon</label>
                            <select id="cat-icon" className="input-dark" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}>
                                {ICONS.map(ic => <option key={ic} value={ic}>{ic} {ic}</option>)}
                            </select>
                        </div>
                        <button id="cat-submit" type="submit" className="btn-primary" style={{ width: '100%' }}>
                            <PlusIcon style={{ width: 15, height: 15 }} />
                            Add Category
                        </button>
                    </form>
                </div>

                {/* Category Lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Expense */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontSize: '1.1rem' }}>💸</span>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171' }}>Expense Categories</h2>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '2px 10px' }}>{expense.length}</span>
                        </div>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
                        ) : expense.length === 0 ? (
                            <p style={{ color: '#334155', textAlign: 'center', padding: '24px 0', fontSize: '0.85rem' }}>No expense categories yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {expense.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                            </div>
                        )}
                    </div>

                    {/* Income */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <span style={{ fontSize: '1.1rem' }}>💰</span>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4ade80' }}>Income Categories</h2>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '2px 10px' }}>{income.length}</span>
                        </div>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
                        ) : income.length === 0 ? (
                            <p style={{ color: '#334155', textAlign: 'center', padding: '24px 0', fontSize: '0.85rem' }}>No income categories yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {income.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
