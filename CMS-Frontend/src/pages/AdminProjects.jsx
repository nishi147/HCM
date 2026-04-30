import API_URL from '../utils/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Edit2, Trash2, Layout, Layers, Check, AlertCircle, BarChart2, Filter, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminProjects = () => {
    const { token } = useAuth();
    

    const [projects, setProjects] = useState([]);
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'analytics'
    const [detailsModal, setDetailsModal] = useState({ isOpen: false, phase: '', module: '', project: '', records: [] });
    const [filterProject, setFilterProject] = useState('All');
    const [expandedProjects, setExpandedProjects] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [error, setError] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // Custom Modal State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: () => {},
        confirmText: 'Confirm'
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        modules: [],
        phases: ['Alpha', 'Beta', 'Gold', 'SCORM'],
        status: 'Active'
    });

    const [newModule, setNewModule] = useState('');
    const [newPhase, setNewPhase] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projRes, tsRes] = await Promise.all([
                axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/timesheets/all`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setProjects(projRes.data);
            setTimesheets(tsRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
    };

    const getAnalyticsData = () => {
        const data = {};
        
        // Initialize with all projects if we want to show inactive ones
        projects.forEach(p => {
            data[p.name] = { total: 0, phases: {}, modules: {} };
        });

        timesheets.forEach(ts => {
            if (filterProject !== 'All' && ts.project !== filterProject) return;

            if (!data[ts.project]) {
                data[ts.project] = { total: 0, phases: {}, modules: {} };
            }

            const rawPhase = ts.phase?.trim();
            if (!rawPhase) return;
            const phaseKey = rawPhase.toUpperCase() === 'SCORM' ? 'SCORM' : rawPhase.charAt(0).toUpperCase() + rawPhase.slice(1).toLowerCase();

            // Project level aggregation
            data[ts.project].total += ts.duration;
            if (!data[ts.project].phases[phaseKey]) data[ts.project].phases[phaseKey] = { total: 0 };
            data[ts.project].phases[phaseKey].total += ts.duration;

            // Module level aggregation
            if (!data[ts.project].modules[ts.module]) {
                data[ts.project].modules[ts.module] = { total: 0, phases: {} };
            }

            const modData = data[ts.project].modules[ts.module];
            modData.total += ts.duration;

            if (!modData.phases[phaseKey]) modData.phases[phaseKey] = { total: 0, records: [] };
            modData.phases[phaseKey].total += ts.duration;
            modData.phases[phaseKey].records.push(ts);
        });
        return data;
    };

    const toggleProjectExpand = (projName) => {
        setExpandedProjects(prev => ({ ...prev, [projName]: !prev[projName] }));
    };

    const analyticsData = getAnalyticsData();
    // Get unique phases for columns based on projects
    const allPhases = ['Alpha', 'Beta', 'Gold', 'SCORM']; // default phases
    projects.forEach(p => p.phases.forEach(ph => {
        const cleanPh = ph?.trim();
        if (cleanPh) {
            const normalized = cleanPh.toUpperCase() === 'SCORM' ? 'SCORM' : cleanPh.charAt(0).toUpperCase() + cleanPh.slice(1).toLowerCase();
            if (!allPhases.includes(normalized)) {
                allPhases.push(normalized);
            }
        }
    }));

    const handleOpenModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                description: project.description || '',
                modules: project.modules || [],
                phases: project.phases || [],
                status: project.status || 'Active'
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: '',
                description: '',
                modules: [],
                phases: ['Alpha', 'Beta', 'Gold', 'SCORM'],
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleDeleteRecord = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Archive Timesheet',
            message: 'Are you sure you want to remove this entry from the panel? It will remain archived in the database.',
            confirmText: 'Archive Entry',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/timesheets/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    // Update local state to remove the record immediately
                    setDetailsModal(prev => ({
                        ...prev,
                        records: prev.records.filter(r => r._id !== id)
                    }));
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    fetchData(); // Refresh main analytics data
                } catch (err) {
                    console.error('Error deleting timesheet record:', err);
                }
            }
        });
    };

    const addModule = () => {
        if (newModule.trim() && !formData.modules.includes(newModule.trim())) {
            setFormData({ ...formData, modules: [...formData.modules, newModule.trim()] });
            setNewModule('');
        }
    };

    const removeModule = (index) => {
        const newModules = formData.modules.filter((_, i) => i !== index);
        setFormData({ ...formData, modules: newModules });
    };

    const addPhase = () => {
        if (newPhase.trim() && !formData.phases.includes(newPhase.trim())) {
            setFormData({ ...formData, phases: [...formData.phases, newPhase.trim()] });
            setNewPhase('');
        }
    };

    const removePhase = (index) => {
        const permanentPhases = ['Alpha', 'Beta', 'Gold', 'SCORM'];
        const phaseToRemove = formData.phases[index];
        
        if (permanentPhases.includes(phaseToRemove)) {
            setConfirmDialog({
                isOpen: true,
                title: 'Permanent Phase',
                message: `The phase "${phaseToRemove}" is part of our standard workflow and cannot be removed.`,
                type: 'info',
                confirmText: 'Got it',
                onConfirm: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
            });
            return;
        }

        const newPhases = formData.phases.filter((_, i) => i !== index);
        setFormData({ ...formData, phases: newPhases });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingProject) {
                await axios.put(`${API_URL}/projects/${editingProject._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/projects`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Project?',
            message: 'Are you sure you want to delete this project? This action will remove all associated modules and phases. This cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Project',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/projects/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    fetchProjects();
                } catch (err) {
                    console.error('Error deleting project:', err);
                }
            }
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Project Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Define projects, modules and view analytics.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <button 
                            onClick={() => setActiveTab('projects')}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeTab === 'projects' ? 'var(--primary-soft)' : 'transparent', color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
                        >
                            <Layout size={16} /> Projects
                        </button>
                        <button 
                            onClick={() => setActiveTab('analytics')}
                            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: activeTab === 'analytics' ? 'var(--primary-soft)' : 'transparent', color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
                        >
                            <BarChart2 size={16} /> Analytics
                        </button>
                    </div>
                    {activeTab === 'projects' && (
                        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} />
                            <span style={{ fontWeight: '600' }}>Add Project</span>
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'projects' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {projects.map(project => (
                    <motion.div
                        layout
                        key={project._id}
                        className="card"
                        style={{ padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{project.name}</h3>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: project.status === 'Active' ? '#f0fdf4' : '#f1f5f9',
                                    color: project.status === 'Active' ? '#16a34a' : '#64748b',
                                    marginTop: '8px',
                                    display: 'inline-block'
                                }}>
                                    {project.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenModal(project)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(project._id)} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-subtle)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, lineClamp: 2 }}>{project.description || 'No description provided.'}</p>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <Layers size={14} /> Modules ({project.modules.length})
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {project.modules.slice(0, 3).map((m, i) => (
                                        <span key={i} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', color: 'var(--text-main)' }}>{m}</span>
                                    ))}
                                    {project.modules.length > 3 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{project.modules.length - 3} more</span>}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <Layout size={14} /> Phases ({project.phases.length})
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {project.phases.slice(0, 3).map((p, i) => (
                                        <span key={i} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', color: 'var(--text-main)' }}>{p}</span>
                                    ))}
                                    {project.phases.length > 3 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{project.phases.length - 3} more</span>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                </div>
            ) : (
                <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            <input 
                                type="checkbox" 
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                style={{ 
                                    width: '16px', 
                                    height: '16px', 
                                    cursor: 'pointer',
                                    accentColor: 'var(--primary)' 
                                }}
                            />
                            Show Inactive Projects (0 Hrs)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 12px' }}>
                            <Filter size={16} color="var(--text-muted)" />
                            <select 
                                value={filterProject} 
                                onChange={(e) => setFilterProject(e.target.value)}
                                style={{ border: 'none', background: 'transparent', padding: '10px 0', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                            >
                                <option value="All">All Projects</option>
                                {projects.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '8px 12px', color: '#1e293b', fontWeight: '800', background: '#f8fafc', borderRight: '1px solid var(--border)' }}>Project Name</th>
                                    <th style={{ padding: '8px 12px', color: '#1e293b', fontWeight: '800', background: '#f8fafc', borderRight: '1px solid var(--border)' }}>Module Name</th>
                                    <th style={{ padding: '8px 12px', color: '#1e293b', fontWeight: '800', background: '#f8fafc', borderRight: '1px solid var(--border)', textAlign: 'center', width: '100px' }}>Total Hrs.</th>
                                    {allPhases.map(phase => (
                                        <th key={phase} style={{ padding: '8px 12px', color: '#64748b', fontWeight: '700', background: '#f8fafc', textTransform: 'capitalize', textAlign: 'center', width: '80px' }}>{phase}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(analyticsData)
                                    .filter(projName => {
                                        if (filterProject !== 'All') return projName === filterProject;
                                        return showInactive || analyticsData[projName].total > 0;
                                    })
                                    .map((projName, pIndex) => {
                                    const projData = analyticsData[projName];
                                    const modules = Object.keys(projData.modules);
                                    const isExpanded = expandedProjects[projName];
                                    
                                    return (
                                        <React.Fragment key={projName}>
                                            {/* Project Summary Row */}
                                            <tr 
                                                onClick={() => toggleProjectExpand(projName)}
                                                style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            >
                                                <td style={{ padding: '8px 12px', fontWeight: '800', color: '#0f172a', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    {projName}
                                                </td>
                                                <td style={{ padding: '8px 12px', fontWeight: '600', color: '#64748b', borderRight: '1px solid var(--border)', fontStyle: 'italic' }}>
                                                    {modules.length} Modules
                                                </td>
                                                <td style={{ padding: '8px 12px', fontWeight: '800', color: '#0f172a', textAlign: 'center', borderRight: '1px solid var(--border)', background: '#e2e8f0' }}>{projData.total} Hrs</td>
                                                {allPhases.map(phase => {
                                                    // Find the matching phase in projData (case-insensitive)
                                                    const matchingPhase = Object.keys(projData.phases).find(p => p.toLowerCase() === phase.toLowerCase());
                                                    const hrs = matchingPhase ? projData.phases[matchingPhase].total : 0;
                                                    return (
                                                        <td key={phase} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: hrs > 0 ? '#1e293b' : '#cbd5e1' }}>
                                                            {hrs > 0 ? `${hrs} Hrs` : '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>

                                            {/* Module Rows (Expandable) */}
                                            {isExpanded && modules.map((modName) => {
                                                const modData = projData.modules[modName];
                                                return (
                                                    <tr key={`${projName}-${modName}`} style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
                                                        <td style={{ padding: '6px 12px', borderRight: '1px solid var(--border)' }}></td>
                                                        <td style={{ padding: '6px 12px', fontWeight: '600', color: '#475569', borderRight: '1px solid var(--border)', paddingLeft: '24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                                                {modName}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '6px 12px', fontWeight: '800', color: '#334155', textAlign: 'center', borderRight: '1px solid var(--border)', background: '#f1f5f9' }}>{modData.total} Hrs</td>
                                                        {allPhases.map(phase => {
                                                            const matchingPhase = Object.keys(modData.phases).find(p => p.toLowerCase() === phase.toLowerCase());
                                                            const phaseData = matchingPhase ? modData.phases[matchingPhase] : null;
                                                            const hrs = phaseData ? phaseData.total : 0;
                                                            return (
                                                                <td key={phase} style={{ padding: '6px 12px', textAlign: 'center' }}>
                                                                    {hrs > 0 ? (
                                                                        <button 
                                                                            onClick={() => setDetailsModal({ isOpen: true, project: projName, module: modName, phase: phase, records: phaseData.records })}
                                                                            style={{ 
                                                                                background: 'none', border: 'none', 
                                                                                color: 'var(--primary)', fontWeight: '700', 
                                                                                cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px' 
                                                                            }}
                                                                        >
                                                                            {hrs} Hrs
                                                                        </button>
                                                                    ) : (
                                                                        <span style={{ color: '#cbd5e1' }}>-</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                                {Object.keys(analyticsData).length === 0 && (
                                    <tr>
                                        <td colSpan={allPhases.length + 3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No timesheet data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Time Details Modal */}
            <AnimatePresence>
                {detailsModal.isOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', maxHeight: '80vh', overflowY: 'auto', background: 'white' }}
                        >
                            <button onClick={() => setDetailsModal({ ...detailsModal, isOpen: false })} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                            
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>Time Log Details</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', fontWeight: '600' }}>
                                {detailsModal.project} • {detailsModal.module} • <span style={{ textTransform: 'capitalize' }}>{detailsModal.phase}</span>
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {detailsModal.records.map((rec, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '15px' }}>{rec.userId?.name || 'Unknown Employee'}</p>
                                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {new Date(rec.date).toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                                    <span style={{ fontWeight: '800', color: '#2563eb' }}>{rec.duration} Hrs</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRecord(rec._id)}
                                                    title="Archive"
                                                    style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div style={{ padding: '10px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                                            <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Comment</span>
                                            {rec.comment || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>No comment provided</span>}
                                        </div>
                                    </div>
                                ))}
                                {detailsModal.records.length === 0 && (
                                    <p style={{ color: 'var(--text-muted)' }}>No records found.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Project Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HCM Cloud Upgrade" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none' }} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Description</label>
                                    <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief project overview..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none', resize: 'none' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Modules Section */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Add Modules</label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <input type="text" value={newModule} onChange={e => setNewModule(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addModule())} placeholder="e.g. Sales" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
                                            <button type="button" onClick={addModule} style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {formData.modules.map((m, i) => (
                                                <span key={i} style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {m} <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeModule(i)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Phases Section */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Add Phases</label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <input type="text" value={newPhase} onChange={e => setNewPhase(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addPhase())} placeholder="e.g. UAT" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
                                            <button type="button" onClick={addPhase} style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {formData.phases.map((p, i) => (
                                                <span key={i} style={{ fontSize: '12px', padding: '4px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {p} <X size={12} style={{ cursor: 'pointer' }} onClick={() => removePhase(i)} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Project Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none', cursor: 'pointer' }}>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>

                                {error && (
                                    <div style={{ padding: '12px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '700' }}>
                                        {editingProject ? 'Update Project' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmDialog 
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title || "Confirmation"}
                message={confirmDialog.message || "Are you sure?"}
                type={confirmDialog.type || "danger"}
                confirmText={confirmDialog.confirmText || "Confirm"}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div>
    );
};

export default AdminProjects;

