import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { Search, Clock, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminAttendance = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const { token } = useAuth();
    

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(`${API_URL}/attendance/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceData(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setLoading(false);
        }
    };

    const filteredAttendance = attendanceData.filter(record => {
        const matchesSearch = (record.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (record.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (record.date || '').includes(searchTerm);
        
        const matchesDate = !filterDate || record.date === filterDate;

        return matchesSearch && matchesDate;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Attendance Records</h1>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '8px 0', color: 'var(--text-main)', fontSize: '13px', outline: 'none' }}
                        />
                    </div>
                    {filterDate && (
                        <button 
                            onClick={() => setFilterDate('')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                        >
                            Clear
                        </button>
                    )}
                    <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', width: '300px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by name, email or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                maxHeight: 'calc(100vh - 180px)'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading attendance records...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check In</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check Out</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttendance.length > 0 ? (
                                filteredAttendance.map((record) => (
                                    <tr key={record._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                                                    {record.userId?.name[0]}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{record.userId?.name}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{record.userId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={14} color="var(--text-muted)" />
                                                {record.date}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} color="#16a34a" />
                                                {(() => {
                                                    if (!record.checkIn) return '--:--';
                                                    const d = new Date(record.checkIn);
                                                    return isNaN(d.getTime()) ? record.checkIn : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                                })()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} color="#dc2626" />
                                                {(() => {
                                                    if (!record.checkOut) return '--:--';
                                                    const d = new Date(record.checkOut);
                                                    return isNaN(d.getTime()) ? record.checkOut : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                                })()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                background: record.status === 'Present' ? '#f0fdf4' : record.status === 'Leave' ? '#f3e8ff' : record.status === 'Absent' ? '#fef2f2' : '#fffbeb',
                                                color: record.status === 'Present' ? '#16a34a' : record.status === 'Leave' ? '#a855f7' : record.status === 'Absent' ? '#ef4444' : '#f59e0b',
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                border: `1px solid ${record.status === 'Present' ? '#dcfce7' : record.status === 'Leave' ? '#e9d5ff' : record.status === 'Absent' ? '#fee2e2' : '#fef3c7'}`
                                            }}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
        </div>
    );
};

export default AdminAttendance;
