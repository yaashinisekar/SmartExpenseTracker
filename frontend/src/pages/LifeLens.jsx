import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    SparklesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    CheckCircleIcon,
    ScaleIcon,
    TrashIcon,
    BookmarkIcon,
    ArrowPathIcon,
    InformationCircleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/* ── Currency Formatter ── */
const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(n || 0);

/* ── Preset Scenarios ── */
const PRESETS = [
    {
        id: 'laptop',
        title: '💻 Tech Gadget',
        badge: 'One-Time',
        name: 'M3 MacBook Pro',
        type: 'ONE_TIME_PURCHASE',
        oneTimeAmount: 65000,
        isExpense: true,
        targetSavingsCushion: 25000,
        projectionHorizonMonths: 6,
        description: 'Evaluating upfront purchase of a work laptop against emergency reserve.',
    },
    {
        id: 'vacation',
        title: '✈️ Vacation Trip',
        badge: 'Holiday',
        name: 'Goa Coastal Getaway',
        type: 'ONE_TIME_PURCHASE',
        oneTimeAmount: 26000,
        isExpense: true,
        targetSavingsCushion: 20000,
        projectionHorizonMonths: 6,
        description: 'Travel flights, stay, and recreational expenses.',
    },
    {
        id: 'fitness',
        title: '🏋️ Gym / Fitness',
        badge: 'Monthly',
        name: 'Personal Training Membership',
        type: 'RECURRING_COMMITMENT',
        recurringMonthlyAmount: 3800,
        recurringDurationMonths: 6,
        targetSavingsCushion: 15000,
        projectionHorizonMonths: 6,
        description: '6-month fitness training subscription commitment.',
    },
    {
        id: 'emi',
        title: '🛵 12-Month EMI',
        badge: 'Commitment',
        name: 'Two-Wheeler EV EMI',
        type: 'DEBT_OR_EMI',
        recurringMonthlyAmount: 4500,
        recurringDurationMonths: 12,
        targetSavingsCushion: 25000,
        projectionHorizonMonths: 12,
        description: 'Fixed installment commitment over a 12-month period.',
    },
    {
        id: 'upskill',
        title: '💼 Course & Raise',
        badge: 'Career',
        name: 'Cloud Certification & Raise',
        type: 'MAJOR_LIFE_EVENT',
        oneTimeAmount: 15000,
        isExpense: true,
        incomeChangeMonthlyAmount: 10000,
        incomeChangeDurationMonths: 6,
        targetSavingsCushion: 20000,
        projectionHorizonMonths: 12,
        description: 'Certification upfront cost offset by expected monthly compensation bump.',
    },
];

const INITIAL_FORM = {
    name: '',
    type: 'ONE_TIME_PURCHASE',
    description: '',
    oneTimeAmount: '',
    oneTimeDate: format(new Date(), 'yyyy-MM-dd'),
    isExpense: true,
    recurringMonthlyAmount: '',
    recurringDurationMonths: 0,
    incomeChangeMonthlyAmount: '',
    incomeChangeDurationMonths: 0,
    targetSavingsCushion: '',
    customStartingFunds: '',
    projectionHorizonMonths: 6,
};

const LifeLens = () => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [simulation, setSimulation] = useState(null);
    const [savedScenarios, setSavedScenarios] = useState([]);
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [isComparing, setIsComparing] = useState(false);

    const [loadingSim, setLoadingSim] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [showMonthlyTable, setShowMonthlyTable] = useState(false);
    const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' | 'saved'

    const fetchSavedScenarios = async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get('/scenarios');
            setSavedScenarios(data || []);
        } catch (err) {
            console.error('Failed to load saved scenarios', err);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchSavedScenarios();
        applyPreset(PRESETS[0]);
    }, []);

    const applyPreset = (preset) => {
        const updated = {
            ...INITIAL_FORM,
            name: preset.name,
            type: preset.type,
            description: preset.description || '',
            oneTimeAmount: preset.oneTimeAmount ? String(preset.oneTimeAmount) : '',
            isExpense: preset.isExpense ?? true,
            recurringMonthlyAmount: preset.recurringMonthlyAmount ? String(preset.recurringMonthlyAmount) : '',
            recurringDurationMonths: preset.recurringDurationMonths || 0,
            incomeChangeMonthlyAmount: preset.incomeChangeMonthlyAmount ? String(preset.incomeChangeMonthlyAmount) : '',
            incomeChangeDurationMonths: preset.incomeChangeDurationMonths || 0,
            targetSavingsCushion: preset.targetSavingsCushion ? String(preset.targetSavingsCushion) : '',
            projectionHorizonMonths: preset.projectionHorizonMonths || 6,
        };
        setFormData(updated);
        runSimulationOnData(updated);
    };

    const runSimulationOnData = async (dataToSimulate) => {
        if (!dataToSimulate.name.trim()) {
            toast.error('Please enter a scenario name');
            return;
        }

        setLoadingSim(true);
        try {
            const payload = {
                name: dataToSimulate.name,
                type: dataToSimulate.type,
                description: dataToSimulate.description,
                oneTimeAmount: dataToSimulate.oneTimeAmount ? Number(dataToSimulate.oneTimeAmount) : 0,
                oneTimeDate: dataToSimulate.oneTimeDate || null,
                isExpense: dataToSimulate.isExpense,
                recurringMonthlyAmount: dataToSimulate.recurringMonthlyAmount ? Number(dataToSimulate.recurringMonthlyAmount) : 0,
                recurringDurationMonths: Number(dataToSimulate.recurringDurationMonths) || 0,
                incomeChangeMonthlyAmount: dataToSimulate.incomeChangeMonthlyAmount ? Number(dataToSimulate.incomeChangeMonthlyAmount) : 0,
                incomeChangeDurationMonths: Number(dataToSimulate.incomeChangeDurationMonths) || 0,
                targetSavingsCushion: dataToSimulate.targetSavingsCushion ? Number(dataToSimulate.targetSavingsCushion) : null,
                customStartingFunds: dataToSimulate.customStartingFunds ? Number(dataToSimulate.customStartingFunds) : null,
                projectionHorizonMonths: Number(dataToSimulate.projectionHorizonMonths) || 6,
            };

            const res = await api.post('/scenarios/simulate', payload);
            setSimulation(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to calculate simulation';
            toast.error(msg);
        } finally {
            setLoadingSim(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        runSimulationOnData(formData);
    };

    const handleSaveScenario = async () => {
        if (!formData.name.trim()) {
            toast.error('Scenario name is required');
            return;
        }

        setLoadingSave(true);
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                description: formData.description,
                oneTimeAmount: formData.oneTimeAmount ? Number(formData.oneTimeAmount) : 0,
                oneTimeDate: formData.oneTimeDate || null,
                isExpense: formData.isExpense,
                recurringMonthlyAmount: formData.recurringMonthlyAmount ? Number(formData.recurringMonthlyAmount) : 0,
                recurringDurationMonths: Number(formData.recurringDurationMonths) || 0,
                incomeChangeMonthlyAmount: formData.incomeChangeMonthlyAmount ? Number(formData.incomeChangeMonthlyAmount) : 0,
                incomeChangeDurationMonths: Number(formData.incomeChangeDurationMonths) || 0,
                targetSavingsCushion: formData.targetSavingsCushion ? Number(formData.targetSavingsCushion) : null,
                customStartingFunds: formData.customStartingFunds ? Number(formData.customStartingFunds) : null,
                projectionHorizonMonths: Number(formData.projectionHorizonMonths) || 6,
            };

            const res = await api.post('/scenarios', payload);
            toast.success(`Scenario "${res.data.name}" saved! 🎯`);
            fetchSavedScenarios();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save scenario';
            toast.error(msg);
        } finally {
            setLoadingSave(false);
        }
    };

    const handleDeleteScenario = async (id, name) => {
        if (!window.confirm(`Delete saved scenario "${name}"?`)) return;
        try {
            await api.delete(`/scenarios/${id}`);
            toast.success('Scenario deleted');
            setSelectedForCompare((prev) => prev.filter((item) => item !== id));
            fetchSavedScenarios();
        } catch {
            toast.error('Failed to delete scenario');
        }
    };

    const handleLoadSavedIntoSimulator = (sc) => {
        const loaded = {
            name: sc.name,
            type: sc.type,
            description: sc.description || '',
            oneTimeAmount: sc.oneTimeAmount ? String(sc.oneTimeAmount) : '',
            oneTimeDate: sc.oneTimeDate || format(new Date(), 'yyyy-MM-dd'),
            isExpense: sc.isExpense ?? true,
            recurringMonthlyAmount: sc.recurringMonthlyAmount ? String(sc.recurringMonthlyAmount) : '',
            recurringDurationMonths: sc.recurringDurationMonths || 0,
            incomeChangeMonthlyAmount: sc.incomeChangeMonthlyAmount ? String(sc.incomeChangeMonthlyAmount) : '',
            incomeChangeDurationMonths: sc.incomeChangeDurationMonths || 0,
            targetSavingsCushion: sc.targetSavingsCushion ? String(sc.targetSavingsCushion) : '',
            customStartingFunds: sc.customStartingFunds ? String(sc.customStartingFunds) : '',
            projectionHorizonMonths: sc.projectionHorizonMonths || 6,
        };
        setFormData(loaded);
        if (sc.simulation) {
            setSimulation(sc.simulation);
        } else {
            runSimulationOnData(loaded);
        }
        setActiveTab('simulate');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleCompareSelect = (id) => {
        setSelectedForCompare((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            }
            if (prev.length >= 5) {
                toast.warning('You can compare at most 5 scenarios simultaneously');
                return prev;
            }
            return [...prev, id];
        });
    };

    const handleRunComparison = async () => {
        if (selectedForCompare.length < 2) {
            toast.error('Select at least 2 saved scenarios to compare');
            return;
        }

        setIsComparing(true);
        try {
            const res = await api.post('/scenarios/compare', { scenarioIds: selectedForCompare });
            setComparisonResult(res.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Comparison calculation failed');
        } finally {
            setIsComparing(false);
        }
    };

    const getVerdictStyle = (code) => {
        switch (code) {
            case 'HIGHLY_AFFORDABLE':
                return {
                    bg: 'rgba(16, 167, 122, 0.08)',
                    border: 'rgba(16, 167, 122, 0.3)',
                    color: '#10A77A',
                    icon: CheckCircleIcon,
                    badge: 'neu-badge-success',
                };
            case 'MODERATE_RISK':
                return {
                    bg: 'rgba(235, 169, 75, 0.08)',
                    border: 'rgba(235, 169, 75, 0.3)',
                    color: '#EBA94B',
                    icon: ExclamationTriangleIcon,
                    badge: 'neu-badge-warning',
                };
            case 'CRITICAL_STRESS':
                return {
                    bg: 'rgba(241, 91, 121, 0.08)',
                    border: 'rgba(241, 91, 121, 0.3)',
                    color: '#F15B79',
                    icon: ShieldCheckIcon,
                    badge: 'neu-badge-danger',
                };
            default: // UNSUSTAINABLE
                return {
                    bg: 'rgba(241, 91, 121, 0.12)',
                    border: 'rgba(241, 91, 121, 0.35)',
                    color: '#F15B79',
                    icon: XCircleIcon,
                    badge: 'neu-badge-danger',
                };
        }
    };

    const chartData = simulation
        ? {
              labels: simulation.monthlyProjections.map((p) => p.label),
              datasets: [
                  {
                      label: 'With This Scenario',
                      data: simulation.monthlyProjections.map((p) => p.closingBalance),
                      borderColor: '#10BFAE',
                      backgroundColor: 'rgba(16, 191, 174, 0.12)',
                      borderWidth: 3,
                      fill: true,
                      tension: 0.35,
                      pointBackgroundColor: '#10BFAE',
                      pointRadius: 4,
                  },
                  {
                      label: 'Baseline Trajectory',
                      data: simulation.monthlyProjections.map((p) => p.baselineClosingBalance),
                      borderColor: '#429CF4',
                      borderDash: [5, 5],
                      borderWidth: 2,
                      fill: false,
                      tension: 0.35,
                      pointRadius: 3,
                  },
                  ...(simulation.targetSavingsCushion
                      ? [
                            {
                                label: `Emergency Cushion Target (${fmt(simulation.targetSavingsCushion)})`,
                                data: simulation.monthlyProjections.map(() => simulation.targetSavingsCushion),
                                borderColor: '#F15B79',
                                borderDash: [4, 4],
                                borderWidth: 1.5,
                                pointRadius: 0,
                                fill: false,
                            },
                        ]
                      : []),
              ],
          }
        : null;

    const chartOptions = {
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

    return (
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <div className="neu-icon-badge" style={{ width: 28, height: 28, background: 'var(--brand-gradient)', color: '#FFFFFF' }}>
                            <SparklesIcon style={{ width: 16, height: 16 }} />
                        </div>
                        <span className="neu-badge neu-badge-teal">Predictive Fintech Engine</span>
                    </div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                        LifeLens™ Financial What-If Simulator
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 680 }}>
                        Simulate major purchases, recurring subscriptions, or income changes against your real cash-flow baseline before spending money.
                    </p>
                </div>

                {/* Tabs: Sandbox vs Saved */}
                <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface-secondary)', padding: 4, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                    <button
                        onClick={() => setActiveTab('simulate')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 10,
                            border: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: activeTab === 'simulate' ? 'var(--brand-gradient)' : 'transparent',
                            color: activeTab === 'simulate' ? '#FFFFFF' : 'var(--text-secondary)',
                            boxShadow: activeTab === 'simulate' ? '0 2px 8px rgba(16, 191, 174, 0.3)' : 'none',
                        }}
                    >
                        ⚡ Simulator Sandbox
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 10,
                            border: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: activeTab === 'saved' ? 'var(--brand-gradient)' : 'transparent',
                            color: activeTab === 'saved' ? '#FFFFFF' : 'var(--text-secondary)',
                            boxShadow: activeTab === 'saved' ? '0 2px 8px rgba(16, 191, 174, 0.3)' : 'none',
                        }}
                    >
                        📁 Saved Scenarios ({savedScenarios.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: SIMULATION SANDBOX */}
            {activeTab === 'simulate' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Quick Preset Templates */}
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                            Quick Simulation Templates
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            {PRESETS.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className="neu-card"
                                    style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        border: formData.name === p.name ? '1px solid var(--brand-teal)' : '1px solid var(--border-subtle)',
                                        background: formData.name === p.name ? 'rgba(16, 191, 174, 0.08)' : 'var(--bg-surface)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                                        <span className="neu-badge neu-badge-teal" style={{ fontSize: '0.62rem' }}>{p.badge}</span>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {p.oneTimeAmount ? fmt(p.oneTimeAmount) : `${fmt(p.recurringMonthlyAmount)}/mo`}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Simulator Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>
                        {/* Left: Input Form */}
                        <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ScaleIcon style={{ width: 20, height: 20, color: 'var(--brand-teal)' }} />
                                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Configure Scenario
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(INITIAL_FORM)}
                                    className="neu-btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.74rem' }}
                                >
                                    <ArrowPathIcon style={{ width: 13, height: 13 }} /> Reset
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                        Scenario Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="neu-input"
                                        placeholder="e.g. MacBook Pro M3 or Bali Vacation"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                            Decision Type
                                        </label>
                                        <select
                                            className="neu-input"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="ONE_TIME_PURCHASE">One-Time Purchase</option>
                                            <option value="RECURRING_COMMITMENT">Monthly Commitment</option>
                                            <option value="INCOME_CHANGE">Income Shift / Bonus</option>
                                            <option value="DEBT_OR_EMI">EMI / Loan</option>
                                            <option value="MAJOR_LIFE_EVENT">Major Life Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                            Horizon
                                        </label>
                                        <select
                                            className="neu-input"
                                            value={formData.projectionHorizonMonths}
                                            onChange={(e) => setFormData({ ...formData, projectionHorizonMonths: Number(e.target.value) })}
                                        >
                                            <option value={3}>3 Months</option>
                                            <option value={6}>6 Months</option>
                                            <option value={12}>12 Months</option>
                                            <option value={24}>24 Months</option>
                                        </select>
                                    </div>
                                </div>

                                {/* One-Time Details */}
                                <div style={{ padding: 14, background: 'var(--bg-surface-secondary)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>One-Time Amount (₹)</span>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isExpense: true })}
                                                style={{
                                                    fontSize: '0.72rem',
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: formData.isExpense ? 'rgba(241, 91, 121, 0.18)' : 'transparent',
                                                    color: formData.isExpense ? 'var(--accent-danger)' : 'var(--text-muted)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Expense
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isExpense: false })}
                                                style={{
                                                    fontSize: '0.72rem',
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: !formData.isExpense ? 'rgba(16, 167, 122, 0.18)' : 'transparent',
                                                    color: !formData.isExpense ? 'var(--accent-mint)' : 'var(--text-muted)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Inflow
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                                        <input
                                            type="number"
                                            className="neu-input"
                                            placeholder="e.g. 50000"
                                            value={formData.oneTimeAmount}
                                            onChange={(e) => setFormData({ ...formData, oneTimeAmount: e.target.value })}
                                        />
                                        <input
                                            type="date"
                                            className="neu-input"
                                            value={formData.oneTimeDate}
                                            onChange={(e) => setFormData({ ...formData, oneTimeDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Recurring Details */}
                                <div style={{ padding: 14, background: 'var(--bg-surface-secondary)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                                    <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                                        Monthly Commitment (Optional)
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                                        <input
                                            type="number"
                                            className="neu-input"
                                            placeholder="₹ per month"
                                            value={formData.recurringMonthlyAmount}
                                            onChange={(e) => setFormData({ ...formData, recurringMonthlyAmount: e.target.value })}
                                        />
                                        <input
                                            type="number"
                                            className="neu-input"
                                            placeholder="Duration (months)"
                                            min={0}
                                            max={60}
                                            value={formData.recurringDurationMonths || ''}
                                            onChange={(e) => setFormData({ ...formData, recurringDurationMonths: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {/* Safety Cushion & Override */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                            Emergency Cushion
                                        </label>
                                        <input
                                            type="number"
                                            className="neu-input"
                                            placeholder="e.g. 25000"
                                            value={formData.targetSavingsCushion}
                                            onChange={(e) => setFormData({ ...formData, targetSavingsCushion: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                                            Starting Balance
                                        </label>
                                        <input
                                            type="number"
                                            className="neu-input"
                                            placeholder="Auto (Recorded)"
                                            value={formData.customStartingFunds}
                                            onChange={(e) => setFormData({ ...formData, customStartingFunds: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                    <button
                                        type="submit"
                                        disabled={loadingSim}
                                        className="neu-btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        {loadingSim ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div className="spinner" style={{ width: 14, height: 14 }} /> Calculating…
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <SparklesIcon style={{ width: 18, height: 18 }} /> Run Simulation
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveScenario}
                                        disabled={loadingSave}
                                        className="neu-btn-secondary"
                                        title="Save scenario for comparison"
                                    >
                                        <BookmarkIcon style={{ width: 18, height: 18, color: 'var(--brand-teal)' }} />
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right: Dynamic Verdict & KPI Cards */}
                        <div>
                            {simulation ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    {/* Verdict Banner Card */}
                                    {(() => {
                                        const vStyle = getVerdictStyle(simulation.affordabilityVerdict);
                                        const IconComp = vStyle.icon;
                                        return (
                                            <div
                                                className="neu-card"
                                                style={{
                                                    padding: 22,
                                                    background: vStyle.bg,
                                                    borderColor: vStyle.border,
                                                    borderRadius: 20,
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                                    <div className="neu-icon-badge" style={{ width: 44, height: 44, background: vStyle.bg, color: vStyle.color }}>
                                                        <IconComp style={{ width: 24, height: 24 }} />
                                                    </div>
                                                    <div>
                                                        <span className={`neu-badge ${vStyle.badge}`}>
                                                            {simulation.affordabilityVerdict.replace('_', ' ')}
                                                        </span>
                                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                                                            {simulation.verdictTitle}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    {simulation.verdictSummary}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* 4 Financial Metrics */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                                        {/* Lowest Projected Balance */}
                                        <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Lowest Projected Balance
                                            </span>
                                            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: simulation.projectedLowestBalance < 0 ? 'var(--accent-danger)' : 'var(--text-primary)', marginTop: 6 }}>
                                                {fmt(simulation.projectedLowestBalance)}
                                            </p>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                Trough in <strong style={{ color: 'var(--brand-teal)' }}>{simulation.lowestBalanceMonth}</strong>
                                            </span>
                                        </div>

                                        {/* Net Impact */}
                                        <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Net Horizon Difference
                                            </span>
                                            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: simulation.netScenarioImpact < 0 ? 'var(--accent-danger)' : 'var(--accent-mint)', marginTop: 6 }}>
                                                {simulation.netScenarioImpact >= 0 ? '+' : ''}{fmt(simulation.netScenarioImpact)}
                                            </p>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                vs. baseline without decision
                                            </span>
                                        </div>

                                        {/* Savings Recovery */}
                                        <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Savings Recovery Time
                                            </span>
                                            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
                                                {simulation.savingsRecoveryMonths ? `${simulation.savingsRecoveryMonths} Months` : 'Exceeds Horizon'}
                                            </p>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                To restore pre-scenario balance
                                            </span>
                                        </div>

                                        {/* Baseline Monthly Surplus */}
                                        <div className="neu-card" style={{ padding: 18, borderRadius: 16 }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Baseline Cash Flow
                                            </span>
                                            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-teal)', marginTop: 6 }}>
                                                {fmt(simulation.monthlyBaselineSurplus)}/mo
                                            </p>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                Inc: {fmt(simulation.monthlyBaselineIncome)} | Exp: {fmt(simulation.monthlyBaselineExpense)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="neu-card-flat" style={{ padding: 48, textAlign: 'center', borderRadius: 20 }}>
                                    <SparklesIcon style={{ width: 44, height: 44, color: 'var(--brand-teal)', opacity: 0.5, margin: '0 auto 12px' }} />
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Configure & Simulate</h3>
                                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: 300, margin: '4px auto 0' }}>
                                        Select a template or enter purchase numbers on the left to project outcomes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interactive Projection Chart */}
                    {simulation && (
                        <div className="neu-card-flat" style={{ padding: 26, borderRadius: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Projected Financial Trajectory
                                    </h3>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Comparing modeled baseline trajectory against simulated decision over {simulation.monthlyProjections.length} months.
                                    </p>
                                </div>
                            </div>

                            <div style={{ height: 320, width: '100%' }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}

                    {/* Explainable Factors & Assumptions */}
                    {simulation && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                            {/* Factors & Recommendations */}
                            <div className="neu-card" style={{ padding: 22, borderRadius: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <InformationCircleIcon style={{ width: 20, height: 20, color: 'var(--brand-teal)' }} />
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Key Financial Drivers
                                    </h4>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {simulation.explainableFactors.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', gap: 8 }}>
                                            <span style={{ color: 'var(--brand-teal)' }}>•</span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--brand-teal)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                                        Actionable Recommendations
                                    </span>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {simulation.recommendations.map((r, i) => (
                                            <li key={i} style={{ display: 'flex', gap: 6 }}>
                                                <span style={{ color: 'var(--accent-mint)' }}>✓</span>
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Trade-Off & Assumptions */}
                            <div className="neu-card" style={{ padding: 22, borderRadius: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                    <ShieldCheckIcon style={{ width: 20, height: 20, color: 'var(--accent-sky)' }} />
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Strategic Trade-Off
                                    </h4>
                                </div>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                                    {simulation.tradeOffSummary}
                                </p>
                                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                                    Model Assumptions
                                </span>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {simulation.assumptions.map((a, i) => (
                                        <li key={i} style={{ display: 'flex', gap: 6 }}>
                                            <span>–</span>
                                            <span>{a}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Expandable Month-by-Month Table */}
                    {simulation && (
                        <div className="neu-card-flat" style={{ padding: 22, borderRadius: 20 }}>
                            <button
                                type="button"
                                onClick={() => setShowMonthlyTable(!showMonthlyTable)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CalendarDaysIcon style={{ width: 20, height: 20, color: 'var(--brand-teal)' }} />
                                    <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                                        Month-by-Month Cash Flow Breakdown
                                    </span>
                                    <span className="neu-badge neu-badge-teal" style={{ fontSize: '0.7rem' }}>
                                        {simulation.monthlyProjections.length} Months
                                    </span>
                                </div>
                                {showMonthlyTable ? (
                                    <ChevronUpIcon style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
                                ) : (
                                    <ChevronDownIcon style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
                                )}
                            </button>

                            {showMonthlyTable && (
                                <div style={{ overflowX: 'auto', marginTop: 18 }}>
                                    <table className="neu-table">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>Opening Balance</th>
                                                <th>Total Income</th>
                                                <th>Total Expense</th>
                                                <th>Net Cash Flow</th>
                                                <th>Closing Balance</th>
                                                <th>Cushion Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {simulation.monthlyProjections.map((p) => (
                                                <tr key={p.monthIndex}>
                                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {p.label}
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>
                                                        {fmt(p.openingBalance)}
                                                    </td>
                                                    <td style={{ color: 'var(--accent-mint)' }}>
                                                        {fmt(p.totalIncome)}
                                                    </td>
                                                    <td style={{ color: 'var(--accent-danger)' }}>
                                                        {fmt(p.totalExpense)}
                                                    </td>
                                                    <td style={{ fontWeight: 700, color: p.netCashFlow >= 0 ? 'var(--accent-mint)' : 'var(--accent-danger)' }}>
                                                        {p.netCashFlow >= 0 ? '+' : ''}{fmt(p.netCashFlow)}
                                                    </td>
                                                    <td style={{ fontWeight: 800, color: p.closingBalance < 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                                                        {fmt(p.closingBalance)}
                                                    </td>
                                                    <td>
                                                        {p.cushionBreached ? (
                                                            <span className="neu-badge neu-badge-danger">Breached ✕</span>
                                                        ) : (
                                                            <span className="neu-badge neu-badge-success">Protected ✓</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: SAVED SCENARIOS & COMPARISON HUB */}
            {activeTab === 'saved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Saved What-If Scenarios
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                                Select 2 to 5 scenarios to compare their liquidity trade-offs side by side.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRunComparison}
                            disabled={selectedForCompare.length < 2 || isComparing}
                            className="neu-btn-primary"
                            style={{ opacity: selectedForCompare.length < 2 ? 0.5 : 1, cursor: selectedForCompare.length < 2 ? 'not-allowed' : 'pointer' }}
                        >
                            <DocumentDuplicateIcon style={{ width: 18, height: 18 }} />
                            Compare Selected ({selectedForCompare.length})
                        </button>
                    </div>

                    {/* Comparison Modal / Container */}
                    {comparisonResult && (
                        <div className="neu-card animate-fade-in-up" style={{ padding: 24, borderRadius: 20, borderColor: 'var(--brand-teal)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <SparklesIcon style={{ width: 22, height: 22, color: 'var(--brand-teal)' }} />
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            Comparison Recommendation: {comparisonResult.recommendedScenarioName}
                                        </h3>
                                    </div>
                                    <p style={{ color: 'var(--brand-teal)', fontSize: '0.85rem', marginTop: 4, fontWeight: 600 }}>
                                        {comparisonResult.recommendationReason}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setComparisonResult(null)}
                                    className="neu-btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto', marginTop: 14 }}>
                                <table className="neu-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>Metric</th>
                                            {comparisonResult.scenarios.map((sc) => (
                                                <th key={sc.scenarioId || sc.scenarioName} style={{ textAlign: 'center' }}>
                                                    {sc.scenarioName}
                                                    {sc.scenarioName === comparisonResult.recommendedScenarioName && (
                                                        <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--accent-mint)' }}>
                                                            ★ Recommended
                                                        </span>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonResult.comparisonTable.map((row) => (
                                            <tr key={row.metricKey}>
                                                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {row.label}
                                                </td>
                                                {comparisonResult.scenarios.map((sc) => (
                                                    <td key={sc.scenarioId || sc.scenarioName} style={{ textAlign: 'center', color: sc.scenarioName === comparisonResult.recommendedScenarioName ? 'var(--brand-teal)' : 'var(--text-secondary)', fontWeight: 600 }}>
                                                        {row.values[sc.scenarioName] || '—'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Saved Cards Grid */}
                    {loadingList ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            Loading saved scenarios…
                        </div>
                    ) : savedScenarios.length === 0 ? (
                        <div className="neu-card-flat" style={{ padding: 48, borderRadius: 20, textAlign: 'center' }}>
                            <BanknotesIcon style={{ width: 44, height: 44, color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 12px' }} />
                            <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>No Saved Scenarios Yet</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 360, margin: '6px auto 18px' }}>
                                Switch to the Simulator Sandbox tab, configure a decision, and click "Save".
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('simulate')}
                                className="neu-btn-primary"
                            >
                                Open Sandbox
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                            {savedScenarios.map((sc) => {
                                const isSelected = selectedForCompare.includes(sc.id);
                                return (
                                    <div
                                        key={sc.id}
                                        className="neu-card"
                                        style={{
                                            padding: 20,
                                            borderRadius: 18,
                                            border: isSelected ? '1px solid var(--brand-teal)' : '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleCompareSelect(sc.id)}
                                                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-teal)' }}
                                                />
                                                <div>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {sc.name}
                                                    </h4>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {sc.type.replace('_', ' ')} • {sc.projectionHorizonMonths}M Horizon
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteScenario(sc.id, sc.name)}
                                                className="neu-btn-danger"
                                                style={{ padding: '6px' }}
                                                title="Delete scenario"
                                            >
                                                <TrashIcon style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>

                                        <div style={{ padding: 10, background: 'var(--bg-surface-secondary)', borderRadius: 10, marginBottom: 12, fontSize: '0.78rem' }}>
                                            {sc.oneTimeAmount > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                                                    <span>One-time {sc.isExpense ? 'Cost' : 'Inflow'}:</span>
                                                    <strong>{fmt(sc.oneTimeAmount)}</strong>
                                                </div>
                                            )}
                                            {sc.recurringMonthlyAmount > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', marginTop: 4 }}>
                                                    <span>Monthly:</span>
                                                    <strong>{fmt(sc.recurringMonthlyAmount)}/mo ({sc.recurringDurationMonths}M)</strong>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleLoadSavedIntoSimulator(sc)}
                                            className="neu-btn-secondary"
                                            style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px' }}
                                        >
                                            Load into Sandbox ↗
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LifeLens;
