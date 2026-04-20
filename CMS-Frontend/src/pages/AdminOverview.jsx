import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, UserPlus, Layers, Gift, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminOverview = ({ setActiveTab }) => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, attRes, leaveRes] = await Promise.all([
                    axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/attendance/all`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/leaves/all`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setEmployees(empRes.data);
                setAttendance(attRes.data);
                setLeaves(leaveRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const getDailyStatus = () => {
        const today = new Date().toISOString().split('T')[0];
        
        const checkedIn = [];
        const checkedOut = [];
        const onLeave = [];
        const absent = [];

        employees.forEach(emp => {
            const att = attendance.find(a => a.userId?._id === emp._id && a.date === today);
            const leave = leaves.find(l => 
                l.userId?._id === emp._id && 
                l.status === 'Approved' && 
                today >= l.startDate && today <= l.endDate
            );

            if (att) {
                if (att.checkOut) checkedOut.push({ ...emp, ...att });
                else checkedIn.push({ ...emp, ...att });
            } else if (leave) {
                onLeave.push({ ...emp, ...leave });
            } else {
                absent.push(emp);
            }
        });

        return { checkedIn, checkedOut, onLeave, absent };
    };

    const getMonthlyStats = () => {
        const monthsData = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const monthPrefix = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            
            const monthAttendance = attendance.filter(a => a.date.startsWith(monthPrefix));
            const inCount = monthAttendance.length;
            const outCount = monthAttendance.filter(a => a.checkOut).length;
            
            // Calculate total leave days in this month
            let leaveDays = 0;
            leaves.forEach(leave => {
                if (leave.status !== 'Approved') return;
                
                let current = new Date(leave.startDate);
                const end = new Date(leave.endDate);
                
                while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0];
                    if (dateStr.startsWith(monthPrefix)) {
                        leaveDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }
            });

            monthsData.push({ month: monthName, in: inCount, out: outCount, leave: leaveDays });
        }
        
        const max = Math.max(...monthsData.flatMap(m => [m.in, m.out, m.leave]), 1);
        return { monthsData, max };
    };

    const upcomingBirthdays = employees
        .filter(emp => emp.dob)
        .map(emp => {
            const today = new Date(); today.setHours(0,0,0,0);
            const dob = new Date(emp.dob);
            const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
            const diffDays = Math.ceil(Math.abs(nextBday - today) / (1000 * 60 * 60 * 24));
            return { ...emp, nextBday, diffDays };
        })
        .sort((a, b) => a.diffDays - b.diffDays)
        .slice(0, 3);

    const dailyStatus = getDailyStatus();
    const { monthsData, max } = getMonthlyStats();

    const stats = [
        { label: 'Checked In', value: dailyStatus.checkedIn.length, icon: Clock, color: '#10b981' },
        { label: 'Checked Out', value: dailyStatus.checkedOut.length, icon: Clock, color: '#ef4444' },
        { label: 'On Leave', value: dailyStatus.onLeave.length, icon: Calendar, color: '#3b82f6' },
        { label: 'Absent', value: dailyStatus.absent.length, icon: Users, color: '#f59e0b' },
    ];
    const [hoveredData, setHoveredData] = useState(null);

    const Tooltip = ({ data }) => (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{ 
                position: 'absolute', 
                bottom: '100%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                marginBottom: '12px',
                background: 'rgba(15, 23, 42, 0.95)',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                alignItems: 'center'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: data.color }}></div>
                <span>{data.label}: {data.value}</span>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(15, 23, 42, 0.95)', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }}></div>
        </motion.div>
    );

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Analytics...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
            {/* Real-time Status Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${stat.color}` }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{stat.value}</h3>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexWrap: 'wrap' }} className="responsive-grid">
                {/* Monthly Trends - Custom CSS Chart */}
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Monthly Analytics</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>In</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Out</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>Leave</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '240px', gap: '24px', paddingBottom: '20px' }}>
                        {monthsData.map((m, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{ position: 'relative', width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
                                    {/* In Bar */}
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${(m.in / max) * 100}%` }} 
                                        whileHover={{ scaleX: 1.1, filter: 'brightness(1.1)' }}
                                        onHoverStart={() => setHoveredData({ month: i, type: 'in', value: m.in, label: 'Checked In', color: '#10b981' })}
                                        onHoverEnd={() => setHoveredData(null)}
                                        style={{ width: '20%', background: '#10b981', borderRadius: '4px 4px 0 0', cursor: 'pointer', position: 'relative' }} 
                                    >
                                        {hoveredData?.month === i && hoveredData?.type === 'in' && <Tooltip data={hoveredData} />}
                                    </motion.div>
                                    {/* Out Bar */}
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${(m.out / max) * 100}%` }} 
                                        whileHover={{ scaleX: 1.1, filter: 'brightness(1.1)' }}
                                        onHoverStart={() => setHoveredData({ month: i, type: 'out', value: m.out, label: 'Checked Out', color: '#ef4444' })}
                                        onHoverEnd={() => setHoveredData(null)}
                                        style={{ width: '20%', background: '#ef4444', borderRadius: '4px 4px 0 0', cursor: 'pointer', position: 'relative' }} 
                                    >
                                        {hoveredData?.month === i && hoveredData?.type === 'out' && <Tooltip data={hoveredData} />}
                                    </motion.div>
                                    {/* Leave Bar */}
                                    <motion.div 
                                        initial={{ height: 0 }} 
                                        animate={{ height: `${(m.leave / max) * 100}%` }} 
                                        whileHover={{ scaleX: 1.1, filter: 'brightness(1.1)' }}
                                        onHoverStart={() => setHoveredData({ month: i, type: 'leave', value: m.leave, label: 'On Leave', color: '#3b82f6' })}
                                        onHoverEnd={() => setHoveredData(null)}
                                        style={{ width: '20%', background: '#3b82f6', borderRadius: '4px 4px 0 0', cursor: 'pointer', position: 'relative' }} 
                                    >
                                        {hoveredData?.month === i && hoveredData?.type === 'leave' && <Tooltip data={hoveredData} />}
                                    </motion.div>
                                </div>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Who is On Leave / Absent */}
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>On Leave Today</h3>
                            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', fontWeight: '700' }}>{dailyStatus.onLeave.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {dailyStatus.onLeave.length > 0 ? dailyStatus.onLeave.slice(0, 4).map((emp, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{emp.name[0]}</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{emp.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{emp.type || 'Casual Leave'}</p>
                                    </div>
                                </div>
                            )) : <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>No ones on leave today</p>}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Birthdays & Anniversaries</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {upcomingBirthdays.map((emp, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '8px', background: '#fff1f2', color: '#e11d48' }}><Gift size={16} /></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>{emp.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{emp.diffDays === 0 ? 'Birthday Today!' : `Birthday in ${emp.diffDays} days`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Status Table (Detailed) */}
            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-main)' }}>Daily Employee Attendance Status</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>EMPLOYEE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>CHECK IN</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>CHECK OUT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...dailyStatus.checkedIn, ...dailyStatus.checkedOut, ...dailyStatus.onLeave, ...dailyStatus.absent.slice(0, 10)].map((emp, i) => {
                                const isIn = dailyStatus.checkedIn.includes(emp);
                                const isOut = dailyStatus.checkedOut.includes(emp);
                                const isLeave = dailyStatus.onLeave.includes(emp);
                                
                                let statusLabel = "Absent";
                                let statusColor = "#f59e0b";
                                if (isIn) { statusLabel = "In Office"; statusColor = "#10b981"; }
                                if (isOut) { statusLabel = "Checked Out"; statusColor = "#ef4444"; }
                                if (isLeave) { statusLabel = "On Leave"; statusColor = "#3b82f6"; }

                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{emp.name}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: `${statusColor}15`, color: statusColor }}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {emp.checkIn ? new Date(emp.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {emp.checkOut ? new Date(emp.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
