import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Filter, Sliders, Calendar, User, FileText, Clock, AlertCircle, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveTable = ({ data, handleStatusUpdate, calculateDuration, getStatusStyle }) => {
    if (data.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No requests found in this category.</div>;
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
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
                {data.map((leave) => {
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
    );
};

const AdminLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');
    const [employeeFilter, setEmployeeFilter] = useState('All');

    const months = [
        { value: '01', label: 'Jan' },
        { value: '02', label: 'Feb' },
        { value: '03', label: 'Mar' },
        { value: '04', label: 'Apr' },
        { value: '05', label: 'May' },
        { value: '06', label: 'Jun' },
        { value: '07', label: 'Jul' },
        { value: '08', label: 'Aug' },
        { value: '09', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' },
    ];

    const uniqueEmployees = [...new Set(leaves.map(leave => leave.userId?.name).filter(Boolean))].sort();

    const { token } = useAuth();
    

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

    const filteredLeaves = leaves.filter(leave => {
        const matchesSearch = (leave.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (leave.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (leave.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
        const matchesType = typeFilter === 'All' || leave.type === typeFilter;
        
        // Month filter logic
        const leaveMonth = leave.startDate ? leave.startDate.split('-')[1] : null;
        const matchesMonth = monthFilter === 'All' || leaveMonth === monthFilter;
        
        // Employee filter logic
        const matchesEmployee = employeeFilter === 'All' || leave.userId?.name === employeeFilter;

        return matchesSearch && matchesStatus && matchesType && matchesMonth && matchesEmployee;
    });

    const leaveRequests = filteredLeaves.filter(leave => leave.type !== 'Comp Off');
    const compOffRequests = filteredLeaves.filter(leave => leave.type === 'Comp Off');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1, minHeight: 0 }}>
            {/* Page Header and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave Management</h1>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 12px' }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <select 
                            value={monthFilter} 
                            onChange={(e) => setMonthFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '10px 0', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <option value="All">All Months</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 12px' }}>
                        <User size={16} color="var(--text-muted)" />
                        <select 
                            value={employeeFilter} 
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '10px 0', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <option value="All">All Employees</option>
                            {uniqueEmployees.map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 12px' }}>
                        <Filter size={16} color="var(--text-muted)" />
                        <select 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '10px 0', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <option value="All">All Types</option>
                            <option value="Comp Off">Comp Off</option>
                            <option value="Paid Leave">Paid Leave</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0 12px' }}>
                        <Sliders size={16} color="var(--text-muted)" />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '10px 0', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '12px', width: '240px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {/* Leave Requests Section */}
                {(typeFilter === 'All' || typeFilter !== 'Comp Off') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '4px', height: '24px', background: 'var(--accent)', borderRadius: '4px' }}></div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Leave Requests</h2>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px' }}>{leaveRequests.length}</span>
                        </div>
                        <div className="card" style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: '20px', 
                            background: 'var(--bg-main)', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                {loading ? (
                                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>Loading...</div>
                                ) : (
                                    <LeaveTable data={leaveRequests} handleStatusUpdate={handleStatusUpdate} calculateDuration={calculateDuration} getStatusStyle={getStatusStyle} />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Comp Off Requests Section */}
                {(typeFilter === 'All' || typeFilter === 'Comp Off') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '4px', height: '24px', background: '#f59e0b', borderRadius: '4px' }}></div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Comp Off Requests</h2>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '12px' }}>{compOffRequests.length}</span>
                        </div>
                        <div className="card" style={{ 
                            border: '1px solid var(--border)', 
                            borderRadius: '20px', 
                            background: 'var(--bg-main)', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                {loading ? (
                                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>Loading...</div>
                                ) : (
                                    <LeaveTable data={compOffRequests} handleStatusUpdate={handleStatusUpdate} calculateDuration={calculateDuration} getStatusStyle={getStatusStyle} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLeave;
