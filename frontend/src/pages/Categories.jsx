import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    TagIcon,
} from '@heroicons/react/24/outline';

const ICONS = ['🍔','🚗','🏠','🎬','💊','📚','✈️','🛍️','💡','🎮','🐾','🎓','💼','💻','📈','🏦','💰','🏋️','☕','🛒'];

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'INCOME'

    const [form, setForm] = useState({ name: '', type: 'EXPENSE', icon: '🍔' });

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data || []);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Category name is required');
            return;
        }
        try {
            await api.post('/categories', form);
            toast.success('Category added successfully! ✅');
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

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditIcon('');
    };

    const saveEdit = async (cat) => {
        if (!editName.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        try {
            await api.put(`/categories/${cat.id}`, { name: editName, type: cat.type, icon: editIcon });
            toast.success('Category updated!');
            cancelEdit();
            fetchCategories();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update category');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"? Linked records may be affected.`)) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted');
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cannot delete this category');
        }
    };

    const filteredCategories = categories.filter((c) => {
        if (filterTab === 'ALL') return true;
        return c.type === filterTab;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 14 }}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading categories…</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                    Financial Categories
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                    Organize your incomes and expenses with custom icons and taxonomy.
                </p>
            </div>

            {/* Grid Layout: Add Category (Left) and Category List (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>
                {/* Add Category Card */}
                <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div className="neu-icon-badge" style={{ width: 36, height: 36, background: 'rgba(16, 191, 174, 0.12)' }}>
                            <TagIcon style={{ width: 18, height: 18, color: 'var(--brand-teal)' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Create New Category
                            </h2>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                Add custom classification for your transactions
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Category Name *
                            </label>
                            <input
                                id="cat-name"
                                type="text"
                                required
                                className="neu-input"
                                placeholder="e.g. Groceries, Streaming, Freelance"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        {/* Type Toggle */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Transaction Type *
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'EXPENSE' })}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 12,
                                        border: form.type === 'EXPENSE' ? '1px solid var(--accent-danger)' : '1px solid var(--border-subtle)',
                                        background: form.type === 'EXPENSE' ? 'rgba(241, 91, 121, 0.12)' : 'var(--bg-surface-secondary)',
                                        color: form.type === 'EXPENSE' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, type: 'INCOME' })}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 12,
                                        border: form.type === 'INCOME' ? '1px solid var(--accent-mint)' : '1px solid var(--border-subtle)',
                                        background: form.type === 'INCOME' ? 'rgba(16, 167, 122, 0.12)' : 'var(--bg-surface-secondary)',
                                        color: form.type === 'INCOME' ? 'var(--accent-mint)' : 'var(--text-secondary)',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                Select Icon: <span style={{ fontSize: '1rem', marginLeft: 4 }}>{form.icon}</span>
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, maxHeight: 130, overflowY: 'auto', padding: 8, background: 'var(--bg-surface-secondary)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                                {ICONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setForm({ ...form, icon: emoji })}
                                        style={{
                                            fontSize: '1.2rem',
                                            padding: 6,
                                            borderRadius: 8,
                                            border: 'none',
                                            background: form.icon === emoji ? 'var(--brand-gradient)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s',
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button id="cat-submit" type="submit" className="neu-btn-primary" style={{ marginTop: 6 }}>
                            <PlusIcon style={{ width: 16, height: 16 }} />
                            Save Category
                        </button>
                    </form>
                </div>

                {/* Categories List (Right) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Active Categories ({categories.length})
                        </h2>
                        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface-secondary)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                            {['ALL', 'EXPENSE', 'INCOME'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterTab(tab)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: 'none',
                                        background: filterTab === tab ? 'var(--brand-gradient)' : 'transparent',
                                        color: filterTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {filteredCategories.map((cat) => {
                            const isEditing = editingId === cat.id;

                            if (isEditing) {
                                return (
                                    <div key={cat.id} className="neu-card" style={{ padding: 14, borderRadius: 14 }}>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                            <input
                                                type="text"
                                                className="neu-input"
                                                style={{ width: 44, textAlign: 'center', padding: '6px' }}
                                                value={editIcon}
                                                onChange={(e) => setEditIcon(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="neu-input"
                                                style={{ flex: 1, padding: '6px 10px' }}
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                            <button
                                                onClick={() => saveEdit(cat)}
                                                className="neu-btn-primary"
                                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                            >
                                                <CheckIcon style={{ width: 14, height: 14 }} /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="neu-btn-secondary"
                                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                            >
                                                <XMarkIcon style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={cat.id} className="neu-card" style={{ padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <span style={{ fontSize: '1.35rem', flexShrink: 0 }}>{cat.icon || '🏷️'}</span>
                                        <div style={{ overflow: 'hidden' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {cat.name}
                                            </span>
                                            <span className={`neu-badge ${cat.type === 'INCOME' ? 'neu-badge-success' : 'neu-badge-danger'}`} style={{ fontSize: '0.62rem', padding: '2px 6px', marginTop: 2 }}>
                                                {cat.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="neu-btn-secondary"
                                            style={{ padding: '6px 8px', borderRadius: 8 }}
                                            title="Edit category"
                                        >
                                            <PencilIcon style={{ width: 13, height: 13 }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            className="neu-btn-danger"
                                            style={{ padding: '6px 8px', borderRadius: 8 }}
                                            title="Delete category"
                                        >
                                            <TrashIcon style={{ width: 13, height: 13 }} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
