import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Tag, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminHoliday = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({ date: '', name: '' });
    const [error, setError] = useState('');

    // Custom Modal State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const { token } = useAuth();
    

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await axios.get(`${API_URL}/holidays`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching holidays:', err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingHoliday) {
                await axios.put(`${API_URL}/holidays/${editingHoliday._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/holidays`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            setEditingHoliday(null);
            setFormData({ date: '', name: '' });
            fetchHolidays();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Holiday?',
            message: 'Are you sure you want to remove this holiday from the calendar? This will affect attendance calculations for all employees.',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/holidays/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    fetchHolidays();
                } catch (err) {
                    console.error('Error deleting holiday:', err);
                }
            }
        });
    };

    const openEditModal = (holiday) => {
        setEditingHoliday(holiday);
        setFormData({ date: holiday.date, name: holiday.name });
        setIsModalOpen(true);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Holiday Management</h1>
                <button onClick={() => { setIsModalOpen(true); setEditingHoliday(null); setFormData({ date: '', name: '' }); }} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} />
                    <span style={{ fontWeight: '600' }}>Add Holiday</span>
                </button>
            </div>

            <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                background: 'var(--bg-main)', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                maxHeight: 'calc(100vh - 180px)'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading holidays...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>S.No</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holiday Name</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.map((holiday, index) => (
                                <tr key={holiday._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{formatDate(holiday.date)}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px' }}>{holiday.name}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                            <button
                                                onClick={() => openEditModal(holiday)}
                                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(holiday._id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                 </div>
            </div>


            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Set a public holiday for the team.</p>

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        <Calendar size={14} /> Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        <Tag size={14} /> Holiday Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="Christmas"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }}>{editingHoliday ? 'Update' : 'Add'}</button>
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
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div>
    );
};

export default AdminHoliday;

