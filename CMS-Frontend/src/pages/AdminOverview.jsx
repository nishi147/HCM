import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, UserPlus, Layers, Gift, Clock, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AdminOverview = ({ setActiveTab }) => {
    const { token } = useAuth();
    
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

    const getMonthWiseSummary = () => {
        const summary = {};
        const [year, month] = selectedMonth.split('-').map(Number);
        const totalDaysInMonth = new Date(year, month, 0).getDate();
        
        employees.forEach(emp => {
            summary[emp._id] = {
                name: emp.name,
                present: 0,
                leave: 0,
                compOff: 0
            };
        });

        leaves.forEach(l => {
            if (l.status !== 'Approved' || !l.userId?._id || !summary[l.userId._id]) return;
            
            let current = new Date(l.startDate);
            const end = new Date(l.endDate);
            
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                if (dateStr.startsWith(selectedMonth)) {
                    const value = l.dayType === 'Half Day' ? 0.5 : 1;
                    if (l.type === 'Comp Off') {
                        summary[l.userId._id].compOff += value;
                    } else {
                        summary[l.userId._id].leave += value;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
        });

        // Calculate present days: Total days in month - (leaves + compOffs)
        Object.keys(summary).forEach(id => {
            const emp = employees.find(e => e._id === id);
            let baseDays = totalDaysInMonth;
            
            if (emp && emp.doj) {
                const dojDate = new Date(emp.doj);
                const endOfMonth = new Date(year, month, 0);

                if (dojDate > endOfMonth) {
                    baseDays = 0; // Joined after this month
                } else if (dojDate.getFullYear() === year && dojDate.getMonth() === month - 1) {
                    // Joined in this month
                    baseDays = endOfMonth.getDate() - dojDate.getDate() + 1;
                }
            }
            
            summary[id].present = Math.max(0, baseDays - summary[id].leave - summary[id].compOff);
        });
        
        return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
    };

    const exportMonthlyAttendance = () => {
        const summary = getMonthWiseSummary();
        const data = summary.map(emp => ({
            Employee: emp.name,
            'Present Days': emp.present,
            'Leave Days': emp.leave,
            'Comp Off': emp.compOff
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${selectedMonth}`);
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(fileData, `Attendance_Summary_${selectedMonth}.xlsx`);
    };

    const upcomingEvents = employees
        .flatMap(emp => {
            const events = [];
            const today = new Date(); today.setHours(0,0,0,0);
            
            if (emp.dob) {
                const dob = new Date(emp.dob);
                const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
                const diffDays = Math.ceil(Math.abs(nextBday - today) / (1000 * 60 * 60 * 24));
                events.push({ ...emp, type: 'Birthday', diffDays, date: nextBday });
            }
            
            if (emp.doj) {
                const doj = new Date(emp.doj);
                const nextAnniversary = new Date(today.getFullYear(), doj.getMonth(), doj.getDate());
                if (nextAnniversary < today) nextAnniversary.setFullYear(today.getFullYear() + 1);
                const diffDays = Math.ceil(Math.abs(nextAnniversary - today) / (1000 * 60 * 60 * 24));
                const years = nextAnniversary.getFullYear() - doj.getFullYear();
                if (years > 0) {
                    events.push({ ...emp, type: 'Work Anniversary', diffDays, date: nextAnniversary, years });
                }
            }
            return events;
        })
        .sort((a, b) => a.diffDays - b.diffDays)
        .slice(0, 6);

    const dailyStatus = getDailyStatus();
    const monthlySummary = getMonthWiseSummary();

    const stats = [
        { label: 'Checked In', value: dailyStatus.checkedIn.length, icon: Clock, color: '#10b981' },
        { label: 'Checked Out', value: dailyStatus.checkedOut.length, icon: Clock, color: '#ef4444' },
        { label: 'On Leave', value: dailyStatus.onLeave.length, icon: Calendar, color: '#3b82f6' },
        { label: 'Absent', value: dailyStatus.absent.length, icon: Users, color: '#f59e0b' },
    ];

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Upcoming Celebrations */}
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Upcoming Celebrations</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                <div style={{ 
                                    padding: '10px', 
                                    borderRadius: '10px', 
                                    background: event.type === 'Birthday' ? '#fff1f2' : '#eff6ff', 
                                    color: event.type === 'Birthday' ? '#e11d48' : '#2563eb' 
                                }}>
                                    {event.type === 'Birthday' ? <Gift size={20} /> : <Briefcase size={20} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{event.name}</p>
                                        <span style={{ 
                                            fontSize: '10px', 
                                            padding: '2px 6px', 
                                            borderRadius: '6px', 
                                            background: event.type === 'Birthday' ? '#ffe4e6' : '#dbeafe', 
                                            color: event.type === 'Birthday' ? '#be123c' : '#1d4ed8',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>{event.type}</span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                        {event.diffDays === 0 ? 
                                            (event.type === 'Birthday' ? 'Birthday Today!' : `${event.years} Year Anniversary Today!`) : 
                                            (event.type === 'Birthday' ? `Birthday in ${event.diffDays} days` : `${event.years} Year Anniversary in ${event.diffDays} days`)
                                        }
                                    </p>
                                </div>
                            </div>
                        )) : <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No upcoming celebrations</p>}
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
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>EMPLOYEE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>CHECK IN</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>CHECK OUT</th>
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
                                            {(() => {
                                                if (!emp.checkIn) return '--:--';
                                                const d = new Date(emp.checkIn);
                                                return isNaN(d.getTime()) ? emp.checkIn : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            })()}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {(() => {
                                                if (!emp.checkOut) return '--:--';
                                                const d = new Date(emp.checkOut);
                                                return isNaN(d.getTime()) ? emp.checkOut : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Month-Wise Attendance Summary */}
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Month-Wise Attendance Summary</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <Calendar size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}
                            />
                        </div>
                        <button onClick={exportMonthlyAttendance} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>EMPLOYEE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>PRESENT DAYS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>LEAVE DAYS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>COMP OFF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlySummary.map((emp, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{emp.name}</td>
                                    <td style={{ padding: '16px', fontSize: '15px', fontWeight: '800', color: '#10b981', textAlign: 'center', background: '#f0fdf4' }}>
                                        {emp.present}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '15px', fontWeight: '800', color: '#3b82f6', textAlign: 'center', background: '#eff6ff' }}>
                                        {emp.leave}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '15px', fontWeight: '800', color: '#f59e0b', textAlign: 'center', background: '#fffbeb' }}>
                                        {emp.compOff}
                                    </td>
                                </tr>
                            ))}
                            {monthlySummary.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No data available for this month.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
