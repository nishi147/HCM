import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Edit2, Trash2, Layout, Layers, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminProjects = () => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [error, setError] = useState('');

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
        phases: ['alpha', 'beta', 'gold', 'scorm'],
        status: 'Active'
    });

    const [newModule, setNewModule] = useState('');
    const [newPhase, setNewPhase] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setLoading(false);
        }
    };

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
                phases: ['alpha', 'beta', 'gold', 'scorm'],
                status: 'Active'
            });
        }
        setIsModalOpen(true);
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
        const permanentPhases = ['alpha', 'beta', 'gold', 'scorm'];
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
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                    fetchProjects();
                } catch (err) {
                    console.error('Error deleting project:', err);
                }
            }
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Project Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Define projects, modules and phases for timesheet tracking.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} />
                    <span style={{ fontWeight: '600' }}>Add Project</span>
                </button>
            </div>

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
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div>
    );
};

export default AdminProjects;

