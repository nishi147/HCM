import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Filter, Sliders, Calendar, User, FileText, Clock, AlertCircle, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await axios.get(`${API_URL}/leaves/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leaves:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/leaves/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeaves();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const calculateDuration = (start, end, dayType = 'Full Day') => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return dayType === 'Half Day' ? '0.5 day(s)' : `${diffDays} day(s)`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' };
            case 'Rejected':
                return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
            case 'Pending':
            default:
                return { bg: '#fffbeb', color: '#f59e0b', border: '#fef3c7' };
        }
    };

    const calculateStats = () => {
        const pending = leaves.filter(l => l.status === 'Pending');
        const compOffPending = pending.filter(l => l.type === 'Comp Off');
        const approvedThisMonth = leaves.filter(l => 
            l.status === 'Approved' && 
            new Date(l.startDate).getMonth() === new Date().getMonth()
        );

        const pendingByEmp = {};
        pending.forEach(l => {
            const name = l.userId?.name || 'Unknown';
            pendingByEmp[name] = (pendingByEmp[name] || 0) + 1;
        });

        return { 
            totalPending: pending.length, 
            compOffPending: compOffPending.length, 
            approvedThisMonth: approvedThisMonth.length,
            pendingByEmp 
        };
    };

    const stats = calculateStats();
    const filteredLeaves = leaves.filter(leave =>
        leave.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1, minHeight: 0 }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave Management</h1>
                <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', width: '360px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search leave requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
                    />
                </div>
            </div>

            {/* Summary Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#fffbeb', color: '#f59e0b' }}><Clock size={24} /></div>
                    <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>Total Pending</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.totalPending}</h3>
                    </div>
                </div>
                <div className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6' }}><Briefcase size={24} /></div>
                    <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>Pending Comp Offs</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.compOffPending}</h3>
                    </div>
                </div>
                <div className="card" style={{ padding: '24px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0' }}>Pending By Employee</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Object.entries(stats.pendingByEmp).length > 0 ? Object.entries(stats.pendingByEmp).map(([name, count]) => (
                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>{name}</span>
                                <span style={{ fontSize: '11px', fontWeight: '800', background: '#64748b', color: 'white', padding: '1px 6px', borderRadius: '10px' }}>{count}</span>
                            </div>
                        )) : <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No pending requests.</p>}
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                border: '1px solid var(--border)', 
                borderRadius: '20px', 
                background: 'var(--bg-main)', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                maxHeight: 'calc(100vh - 280px)'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>Loading leave requests...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Leave Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Day Type</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.map((leave) => {
                                const status = getStatusStyle(leave.status);
                                const isCompOff = leave.type === 'Comp Off';
                                return (
                                    <tr key={leave._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: isCompOff ? '#fffbeb40' : 'transparent' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{leave.userId?.name || 'Unknown'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                                                {leave.startDate === leave.endDate ? leave.startDate : `${leave.startDate} → ${leave.endDate}`}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ 
                                                color: isCompOff ? '#b45309' : '#64748b', 
                                                fontSize: '12px', 
                                                fontWeight: '800',
                                                background: isCompOff ? '#fef3c7' : 'transparent',
                                                padding: isCompOff ? '4px 8px' : '0',
                                                borderRadius: '6px'
                                            }}>{leave.type}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ 
                                                background: leave.dayType === 'Half Day' ? '#fef3c7' : '#f1f5f9',
                                                color: leave.dayType === 'Half Day' ? '#b45309' : '#475569',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>{leave.dayType || 'Full Day'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{calculateDuration(leave.startDate, leave.endDate, leave.dayType)}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>{leave.reason}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                background: status.bg,
                                                color: status.color,
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                border: `1px solid ${status.border}`
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            {leave.status === 'Pending' ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                                        title="Approve"
                                                        style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                                        title="Reject"
                                                        style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ width: '60px' }}></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
        </div>
    );
};

export default AdminLeave;
