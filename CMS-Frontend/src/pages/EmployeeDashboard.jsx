import API_URL from '../utils/api';
import manshuLogo from '../assets/manshu_logo.png';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Settings from './Settings';
import { Clock, CheckCircle, Calendar, Briefcase, CreditCard, Check, AlertCircle, ChevronRight, LayoutGrid, FileText, Gift, Plus, ChevronLeft, Menu, DollarSign, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Mock/Simple views for now, can be expanded or moved to separate files
const CelebrationCard = ({ type, user, years }) => {
    const isBirthday = type === 'birthday';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                background: isBirthday
                    ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                padding: '32px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '32px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                opacity: 0.2,
                transform: 'rotate(15deg)'
            }}>
                {isBirthday ? <Gift size={120} /> : <Briefcase size={120} />}
            </div>

            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)'
            }}>
                {isBirthday ? <Gift size={40} /> : <CheckCircle size={40} />}
            </div>

            <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
                    {isBirthday ? `Happy Birthday, ${user.name}!` : `Happy Work Anniversary!`}
                </h2>
                <p style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px', fontWeight: '600' }}>
                    {isBirthday
                        ? "Wishing you a wonderful day filled with joy and celebration! 🎂✨"
                        : `Congratulations on completing ${years} year${years > 1 ? 's' : ''} with us! Thank you for your amazing contribution. 🚀🌟`}
                </p>
            </div>
        </motion.div>
    );
};

const AttendanceTracker = ({ data, handleCheckIn, handleCheckOut, error, viewDate, handlePrevMonth, handleNextMonth }) => {
    const { attendance, attendanceHistory, timesheets, holidays = [] } = data;
    const [elapsedTime, setElapsedTime] = useState('00:00:00');


    useEffect(() => {
        let interval;
        if (attendance?.checkIn && !attendance?.checkOut) {
            interval = setInterval(() => {
                const now = new Date();
                let checkInDate;

                if (attendance.checkIn.includes('T')) {
                    // New ISO format
                    checkInDate = new Date(attendance.checkIn);
                } else {
                    // Legacy HH:MM:SS format
                    const [h, m, s] = attendance.checkIn.split(':').map(Number);
                    checkInDate = new Date();
                    checkInDate.setHours(h, m, s, 0);
                }

                const diff = now - checkInDate;
                if (diff > 0) {
                    const hours = Math.floor(diff / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setElapsedTime(
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    );
                }
            }, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => clearInterval(interval);
    }, [attendance]);

    // Calendar logic
    const today = new Date();
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getDayData = (day) => {
        if (!day) return null;
        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTimesheets = timesheets.filter(ts => ts.date === dateStr);
        const att = attendanceHistory.find(ah => ah.date === dateStr);
        const isHoliday = holidays.find(h => h.date === dateStr);

        let status = 'none';
        if (isHoliday) status = 'holiday';
        else if (att) status = 'completed';

        return { status, isHoliday };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Attendance Tracker</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track your daily working hours</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{elapsedTime}</div>
                        {!attendance?.checkIn ? (
                            <button onClick={handleCheckIn} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', border: 'none', color: 'white', fontWeight: '700' }}>
                                <CheckCircle size={18} />
                                <span>Check In</span>
                            </button>
                        ) : !attendance?.checkOut ? (
                            <button onClick={handleCheckOut} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '700' }}>
                                <Clock size={18} />
                                <span>Check Out</span>
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={18} color="#10b981" />
                                <span style={{ color: '#64748b', fontWeight: '700', fontSize: '14px' }}>Shift Completed</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Monthly Overview
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={handlePrevMonth} 
                                style={{ 
                                    padding: '8px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    background: 'white', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    opacity: viewDate.getFullYear() * 12 + viewDate.getMonth() <= (new Date().getFullYear() * 12 + new Date().getMonth() - 4) ? 0.5 : 1,
                                    pointerEvents: viewDate.getFullYear() * 12 + viewDate.getMonth() <= (new Date().getFullYear() * 12 + new Date().getMonth() - 4) ? 'none' : 'auto'
                                }} 
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={handleNextMonth} 
                                style={{ 
                                    padding: '8px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    background: 'white', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    opacity: viewDate.getFullYear() * 12 + viewDate.getMonth() >= (new Date().getFullYear() * 12 + new Date().getMonth() + 4) ? 0.5 : 1,
                                    pointerEvents: viewDate.getFullYear() * 12 + viewDate.getMonth() >= (new Date().getFullYear() * 12 + new Date().getMonth() + 4) ? 'none' : 'auto'
                                }} 
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', paddingBottom: '12px' }}>{d}</div>
                        ))}
                        {days.map((day, i) => {
                            const data = getDayData(day);
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                            const getStyles = () => {
                                if (!day) return { visibility: 'hidden' };
                                let styles = {
                                    aspectRatio: '1.8',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.2s ease'
                                };

                                if (isToday) {
                                    styles.border = '2px solid #3b82f6';
                                    styles.background = 'white';
                                    styles.boxShadow = '0 4px 12px rgba(59, 130, 146, 0.1)';
                                } else if (data.status === 'completed') {
                                    styles.background = '#f0fdf4';
                                    styles.border = '1px solid #10b981';
                                } else if (data.status === 'holiday') {
                                    styles.background = '#f3e8ff';
                                    styles.border = '1px solid #d8b4fe';
                                }

                                return styles;
                            };

                            return (
                                <div key={i} style={getStyles()}>
                                    {day && (
                                        <>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>{day}</span>
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: data.status === 'completed' ? '#10b981' : data.status === 'holiday' ? '#a855f7' : '#94a3b8'
                                            }} />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                        {[
                            { color: '#10b981', label: 'Present' },
                            { color: '#94a3b8', label: 'Absent / Leave' },
                            { color: '#a855f7', label: 'Public Holiday' }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px', fontWeight: '600', textAlign: 'center' }}>{error}</p>}
            </div>
        </div>
    );
};
const DashboardHome = ({ data, handleCheckIn, handleCheckOut, error, viewDate, handlePrevMonth, handleNextMonth }) => {
    const { user } = useAuth();
    const { timesheets, leaves, holidays, attendanceHistory } = data;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header Section */}
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }} />
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Active</span>
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.name.split(' ')[0]} ✨
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px', fontWeight: '600' }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div style={{
                    background: '#f1f5f9',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <Clock size={20} color="#3b82f6" />
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                </div>
            </header>

            {/* Celebration Cards */}
            {(() => {
                if (!user) return null;
                const today = new Date();
                const m = today.getMonth() + 1;
                const d = today.getDate();
                const cards = [];

                if (user.dob) {
                    const [bYear, bMonth, bDay] = user.dob.split('-').map(Number);
                    if (bMonth === m && bDay === d) {
                        cards.push(<CelebrationCard key="bday" type="birthday" user={user} />);
                    }
                }

                if (user.doj) {
                    const [jYear, jMonth, jDay] = user.doj.split('-').map(Number);
                    if (jMonth === m && jDay === d) {
                        const years = today.getFullYear() - jYear;
                        if (years > 0) {
                            cards.push(<CelebrationCard key="anniv" type="anniversary" user={user} years={years} />);
                        }
                    }
                }

                return cards;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Attendance Tracker Core Section */}
                <AttendanceTracker
                    data={data}
                    handleCheckIn={handleCheckIn}
                    handleCheckOut={handleCheckOut}
                    error={error}
                    viewDate={viewDate}
                    handlePrevMonth={handlePrevMonth}
                    handleNextMonth={handleNextMonth}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {[
                        { label: 'Present Days', value: attendanceHistory.length, icon: Check, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Logged Timesheets', value: timesheets.length, icon: Briefcase, color: '#3b82f6', bg: '#eff6ff' }
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{ padding: '24px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '16px' }}>
                                <stat.icon size={20} />
                            </div>
                            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                    {/* Recent Activities */}
                    <div className="card" style={{ padding: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Recent Activities</h2>
                            <button style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '700', background: 'none', border: 'none' }}>View All</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {timesheets.slice(0, 5).map((ts, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', border: '1px solid var(--border)' }}>
                                        <Briefcase size={18} color="var(--primary)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.project}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{ts.module} • {ts.phase}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Logged</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ts.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Utilization Indicator */}
                    <div className="card" style={{ padding: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '24px' }}>Employee Utilization</h2>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary)" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * (Math.min(timesheets.length, 22) / 22))} strokeLinecap="round" transform="rotate(-90 80 80)" />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>{Math.round((Math.min(timesheets.length, 22) / 22) * 100)}%</h4>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Target achieved</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px', fontWeight: '500' }}>You have completed {timesheets.length} days this month.</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TimesheetView = ({ timesheets, fetchDashboardData }) => {
    const { token } = useAuth();
    
    const [showForm, setShowForm] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProjectData, setSelectedProjectData] = useState(null);
    const [formData, setFormData] = useState({
        project: '',
        module: '',
        phase: '',
        duration: '',
        comment: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [status, setStatus] = useState({ type: '', msg: '' });

    // Filters
    const [filterProject, setFilterProject] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await axios.get(`${API_URL}/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(res.data.filter(p => p.status === 'Active'));
            } catch (err) {
                console.error('Error fetching projects:', err);
            }
        };
        fetchProjects();
    }, [token]);

    const handleProjectChange = (e) => {
        const projectName = e.target.value;
        const project = projects.find(p => p.name === projectName);
        setSelectedProjectData(project || null);
        setFormData({ 
            ...formData, 
            project: projectName, 
            module: '', 
            phase: '' 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        try {
            await axios.post(`${API_URL}/timesheets`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Timesheet entry added!' });
            setFormData({
                project: '',
                module: '',
                phase: '',
                duration: '',
                comment: '',
                date: new Date().toISOString().split('T')[0]
            });
            setSelectedProjectData(null);
            setShowForm(false);
            fetchDashboardData();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to add entry' });
        }
    };

    // Filter Logic
    const filteredTimesheets = timesheets.filter(ts => {
        if (filterProject && ts.project !== filterProject) return false;
        if (filterStatus && ts.status !== filterStatus) return false;
        if (filterMonth && !ts.date.startsWith(filterMonth)) return false;
        return true;
    });

    const uniqueProjects = [...new Set(timesheets.map(ts => ts.project))];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>My Timesheets</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> {showForm ? 'Cancel' : 'Add Entry'}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="card"
                        style={{ padding: '24px', background: 'white', overflow: 'hidden' }}
                    >
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Project Name</label>
                                <select 
                                    required 
                                    value={formData.project} 
                                    onChange={handleProjectChange} 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Module</label>
                                <select 
                                    required 
                                    value={formData.module} 
                                    onChange={e => setFormData({ ...formData, module: e.target.value })} 
                                    disabled={!selectedProjectData}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                                >
                                    <option value="">Select Module</option>
                                    {selectedProjectData?.modules.map((m, i) => <option key={i} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Phase</label>
                                <select 
                                    required 
                                    value={formData.phase} 
                                    onChange={e => setFormData({ ...formData, phase: e.target.value })} 
                                    disabled={!selectedProjectData}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}
                                >
                                    <option value="">Select Phase</option>
                                    {(selectedProjectData?.phases?.length > 0 
                                        ? selectedProjectData.phases 
                                        : ['alpha', 'beta', 'gold', 'scorm']
                                    ).map((p, i) => <option key={i} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Date</label>
                                <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Duration (Hours)</label>
                                <input required type="number" min="0.5" step="0.5" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 4" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Comment</label>
                                <input type="text" value={formData.comment} onChange={e => setFormData({ ...formData, comment: e.target.value })} placeholder="What did you work on?" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 2' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '700' }}>Submit Entry</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {status.msg && (
                <div style={{ padding: '12px', borderRadius: '8px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#16a34a' : '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                    {status.msg}
                </div>
            )}

            {/* Filters Section */}
            <div className="card" style={{ padding: '20px', background: 'white', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Filter by Project</label>
                    <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                        <option value="">All Projects</option>
                        {uniqueProjects.map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Filter by Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                        <option value="">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Filter by Month</label>
                    <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                </div>
                <button 
                    onClick={() => { setFilterProject(''); setFilterStatus(''); setFilterMonth(''); }}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-end', height: '40px' }}
                >
                    Clear Filters
                </button>
            </div>

            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'white', maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTimesheets.map((ts, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.project}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{ts.module} • {ts.phase}</p>
                                {ts.comment && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>"{ts.comment}"</p>}
                            </div>
                            <div style={{ textAlign: 'right', marginRight: '40px' }}>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.duration} Hours</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(ts.date).toLocaleDateString()}</p>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: ts.status === 'Approved' ? '#f0fdf4' : ts.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                color: ts.status === 'Approved' ? '#16a34a' : ts.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                            }}>
                                {ts.status}
                            </span>
                        </div>
                    ))}
                    {filteredTimesheets.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No timesheets found matching your filters.</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const AttendanceLogsView = ({ attendanceHistory }) => {
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    const filteredLogs = attendanceHistory.filter(record => {
        if (filterStatus && record.status !== filterStatus) return false;
        if (filterMonth && !record.date.startsWith(filterMonth)) return false;
        return true;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Attendance Logs</h2>
            
            {/* Filters Section */}
            <div className="card" style={{ padding: '20px', background: 'white', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Filter by Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                        <option value="">All Statuses</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Leave">Leave</option>
                    </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>Filter by Month</label>
                    <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                </div>
                <button 
                    onClick={() => { setFilterStatus(''); setFilterMonth(''); }}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-end', height: '40px' }}
                >
                    Clear Filters
                </button>
            </div>

            <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Log History</h3>
                </div>
                <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                            <tr>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Check In</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Check Out</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((record, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', color: '#16a34a', fontWeight: '700' }}>
                                        {record.checkIn ? (record.checkIn.includes('T') ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : record.checkIn) : '--:--'}
                                    </td>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>
                                        {record.checkOut ? (record.checkOut.includes('T') ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : record.checkOut) : '--:--'}
                                    </td>
                                    <td style={{ padding: '20px 32px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: '#f0fdf4',
                                            color: '#16a34a',
                                            border: '1px solid #dcfce7'
                                        }}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance logs found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const LeaveView = ({ leaves, fetchDashboardData }) => {
    const { token, user } = useAuth();
    

    // Summary calculations with dynamic accrual based on DOJ (2 days per month)
    const getAccruedLeave = () => {
        if (!user?.createdAt) return 0;
        const createdDate = new Date(user.createdAt);
        const now = new Date();
        const months = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
        return Math.max(0, months * 2);
    };

    const accruedPaidLeave = getAccruedLeave();

    const calculateDuration = (start, end, dayType = 'Full Day') => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s) || isNaN(e)) return 0;
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        if (diff <= 0) return 0;
        return dayType === 'Half Day' ? diff * 0.5 : diff;
    };

    const rawPaidLeavesUsed = leaves
        .filter(l => l.type === 'Paid Leave' && l.status === 'Approved')
        .reduce((sum, l) => sum + calculateDuration(l.startDate, l.endDate, l.dayType), 0);

    const paidLeavesUsedDisplay = Math.min(rawPaidLeavesUsed, accruedPaidLeave);
    const paidLeavesRemaining = Math.max(0, accruedPaidLeave - rawPaidLeavesUsed);

    // Form States
    const [leaveForm, setLeaveForm] = useState({
        startDate: '',
        endDate: '',
        type: 'Paid Leave',
        dayType: 'Full Day',
        reason: ''
    });

    const [compForm, setCompForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Full Day',
        reason: ''
    });

    const [status, setStatus] = useState({ type: '', msg: '' });

    const stats = [
        { label: 'Paid Leave', used: paidLeavesUsedDisplay, limit: accruedPaidLeave },
    ];

    // Update form type if paid leaves run out or if the current type is invalid
    useEffect(() => {
        if (paidLeavesRemaining <= 0 && leaveForm.type === 'Paid Leave') {
            setLeaveForm(prev => ({ ...prev, type: 'Unpaid Leave' }));
        }
    }, [paidLeavesRemaining, leaveForm.type]);

    const handleSubmit = async (formData) => {
        setStatus({ type: '', msg: '' });
        try {
            const payload = formData;

            // Simple validation
            if (!payload.startDate || !payload.endDate || !payload.reason) {
                setStatus({ type: 'error', msg: 'Please fill in all required fields (Dates and Reason).' });
                return;
            }

            // Paid Leave Balance Validation
            const duration = calculateDuration(payload.startDate, payload.endDate, payload.dayType);
            if (payload.type === 'Paid Leave' && duration > paidLeavesRemaining) {
                setStatus({ type: 'error', msg: `Insufficient Paid Leave balance. You only have ${paidLeavesRemaining} day(s) left. Please apply for excess days as Unpaid Leave.` });
                return;
            }

            await axios.post(`${API_URL}/leaves`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Leave applied successfully!' });
            fetchDashboardData();
            setLeaveForm({ startDate: '', endDate: '', type: 'Paid Leave', dayType: 'Full Day', reason: '' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
        }
    };

    const handleCompSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        try {
            if (!compForm.reason) {
                setStatus({ type: 'error', msg: 'Please provide a reason for Comp Off.' });
                return;
            }
            await axios.post(`${API_URL}/leaves`, {
                startDate: compForm.date,
                endDate: compForm.date,
                type: 'Comp Off',
                reason: compForm.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Comp Off request submitted!' });
            setCompForm({ date: new Date().toISOString().split('T')[0], type: 'Full Day', reason: '' });
            fetchDashboardData();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave Management</h2>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: i === 0 ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#3b82f6' : '#64748b' }}>
                            {i === 0 ? <Briefcase size={24} /> : <Calendar size={24} />}
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                {stat.used} <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '500' }}>/ {stat.limit}</span>
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Apply for Leave Form */}
                <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Apply for Leave</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Request time off from your manager</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>From Date</label>
                            <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>To Date</label>
                            <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Leave Type</label>
                            <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                <option value="Paid Leave" disabled={paidLeavesRemaining <= 0}>Paid Leave ({paidLeavesRemaining} left)</option>
                                <option value="Unpaid Leave">Unpaid Leave</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Day Type</label>
                            <select value={leaveForm.dayType} onChange={e => setLeaveForm({ ...leaveForm, dayType: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                <option value="Full Day">Full Day</option>
                                <option value="Half Day">Half Day</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Reason for Leave</label>
                        <textarea rows="4" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Please provide a brief reason for your leave request..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6', resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                            {leaveForm.startDate && leaveForm.endDate && (
                                <span>Duration: {calculateDuration(leaveForm.startDate, leaveForm.endDate, leaveForm.dayType)} day(s)</span>
                            )}
                        </div>
                        <button onClick={() => handleSubmit(leaveForm)} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Check size={18} />
                            <span>Submit Request</span>
                        </button>
                    </div>
                </div>

                {/* Apply for Comp Off Card */}
                <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Apply for Comp Off</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Request compensatory leave for extra work</p>
                        </div>
                    </div>

                    <form onSubmit={handleCompSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Comp Off Date</label>
                                <input required type="date" value={compForm.date} onChange={e => setCompForm({ ...compForm, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Type</label>
                                <select value={compForm.type} onChange={e => setCompForm({ ...compForm, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                    <option value="Full Day">Full Day</option>
                                    <option value="Half Day">Half Day</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Reason</label>
                            <textarea required rows="4" value={compForm.reason} onChange={e => setCompForm({ ...compForm, reason: e.target.value })} placeholder="Briefly explain the reason for comp-off..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6', resize: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', background: '#f59e0b', border: 'none' }}>
                                <Check size={18} />
                                <span>Request Comp Off</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {status.msg && (
                <div style={{ padding: '12px 20px', borderRadius: '10px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#16a34a' : '#ef4444', fontWeight: '600', fontSize: '14px' }}>
                    {status.msg}
                </div>
            )}

            {/* Leave History Table */}
            <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Leave History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>From</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>To</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((leave, i) => {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{leave.type}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{start.toLocaleDateString()}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{end.toLocaleDateString()}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>
                                            {calculateDuration(leave.startDate, leave.endDate, leave.dayType)} day(s)
                                            {leave.dayType === 'Half Day' && <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>(Half)</span>}
                                        </td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{leave.reason}</td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                background: leave.status === 'Approved' ? '#f0fdf4' : leave.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                                color: leave.status === 'Approved' ? '#16a34a' : leave.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};


const PaySlipModal = ({ payroll, user, onClose }) => {
    const handlePrint = () => {
        const printContent = document.getElementById('printable-payslip').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>PaySlip_${payroll.month}_${user.name}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                        body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                        .logo-section h1 { margin: 0; color: #2563eb; }
                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .detail-item { margin-bottom: 12px; }
                        .detail-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
                        .detail-value { font-size: 15px; font-weight: 600; margin-top: 2px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        th { text-align: left; background: #f8fafc; padding: 12px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                        td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                        .net-pay { background: #2563eb; color: white; padding: 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
                        .net-pay h2 { margin: 0; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>window.print(); setTimeout(() => window.close(), 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                    <h3 style={{ margin: 0 }}>Payslip for {payroll.month}</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Printer size={16} /> Print / Save PDF
                        </button>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Close</button>
                    </div>
                </div>

                <div id="printable-payslip" style={{ padding: '40px' }}>
                    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '32px' }}>
                        <div className="logo-section">
                            <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '24px', fontWeight: '800' }}>HCM CLOUD</h1>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Payslip Statement</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '700' }}>MONTH & YEAR</p>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{payroll.month}</p>
                        </div>
                    </div>

                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px', marginBottom: '40px' }}>
                        <div>
                            <div className="detail-item">
                                <div className="detail-label" style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Employee Name</div>
                                <div className="detail-value" style={{ fontSize: '16px', fontWeight: '700' }}>{user.name}</div>
                            </div>
                            <div className="detail-item" style={{ marginTop: '16px' }}>
                                <div className="detail-label" style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Email Address</div>
                                <div className="detail-value" style={{ fontSize: '14px', color: '#64748b' }}>{user.email}</div>
                            </div>
                        </div>
                        <div>
                            <div className="detail-item">
                                <div className="detail-label" style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Payment Status</div>
                                <div className="detail-value" style={{ fontSize: '14px', fontWeight: '800', color: payroll.status === 'Paid' ? '#16a34a' : '#f59e0b' }}>{payroll.status.toUpperCase()}</div>
                            </div>
                            <div className="detail-item" style={{ marginTop: '16px' }}>
                                <div className="detail-label" style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Payment Date</div>
                                <div className="detail-value" style={{ fontSize: '14px', color: '#64748b' }}>{payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '800' }}>DESCRIPTION</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', fontWeight: '800' }}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>Standard Base Salary</td>
                                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>{formatCurrency(payroll.base)}</td>
                            </tr>
                            {payroll.bonus > 0 && (
                                <tr>
                                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>Incentives & Bonuses (Extra {payroll.extraDays} days)</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#16a34a' }}>+ {formatCurrency(payroll.bonus)}</td>
                                </tr>
                            )}
                            {payroll.tax > 0 && (
                                <tr>
                                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>Income Tax Deductions</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#dc2626' }}>- {formatCurrency(payroll.tax)}</td>
                                </tr>
                            )}
                            {payroll.deductions > 0 && (
                                <tr>
                                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>Other Deductions / Unpaid Leave</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#dc2626' }}>- {formatCurrency(payroll.deductions)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ background: 'var(--primary)', color: 'white', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase' }}>Net Payable Amount</p>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '800' }}>{formatCurrency(payroll.netPay)}</h2>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Total Earnings: {formatCurrency(payroll.base + payroll.bonus)}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.8 }}>Total Deductions: {formatCurrency(payroll.tax + payroll.deductions)}</p>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>This is a computer generated document and does not require a signature.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const PayrollView = ({ payrolls, user }) => {
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>My Payroll</h2>
            </div>

            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'white' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {payrolls.length > 0 ? payrolls.map((payroll, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <DollarSign size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Payslip for {payroll.month}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Status: <span style={{ fontWeight: '700', color: payroll.status === 'Paid' ? '#16a34a' : '#f59e0b' }}>{payroll.status}</span>
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>{formatCurrency(payroll.netPay)}</p>
                                <button 
                                    onClick={() => setSelectedPayroll(payroll)}
                                    className="btn-primary" 
                                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', marginTop: '8px', background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: '700' }}
                                >
                                    View & Download
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No payroll records found for you yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedPayroll && (
                <PaySlipModal 
                    payroll={selectedPayroll} 
                    user={user} 
                    onClose={() => setSelectedPayroll(null)} 
                />
            )}
        </motion.div>
    );
};

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewDate, setViewDate] = useState(new Date());

    // Dynamic Data States
    const [timesheets, setTimesheets] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    const { user, token } = useAuth();
    

    const fetchDashboardData = useCallback(async () => {
        try {
            const params = {
                month: viewDate.getMonth() + 1,
                year: viewDate.getFullYear()
            };

            const headers = { Authorization: `Bearer ${token}` };

            // Fetch all data in parallel; use allSettled so one failure doesn't block the rest
            const [attRes, tsRes, lvRes, hlRes, histRes, pyRes] = await Promise.allSettled([
                axios.get(`${API_URL}/attendance/status`, { headers }),
                axios.get(`${API_URL}/timesheets/my`, { headers }),
                axios.get(`${API_URL}/leaves/my`, { headers }),
                axios.get(`${API_URL}/holidays`, { headers }),
                axios.get(`${API_URL}/attendance/history`, { headers }),
                axios.get(`${API_URL}/payroll/my`, { headers })
            ]);

            if (attRes.status === 'fulfilled') setAttendance(attRes.value.data?.checkIn ? attRes.value.data : null);
            if (tsRes.status === 'fulfilled') setTimesheets(tsRes.value.data);
            if (lvRes.status === 'fulfilled') setLeaves(lvRes.value.data);
            if (hlRes.status === 'fulfilled') setHolidays(hlRes.value.data);
            if (histRes.status === 'fulfilled') setAttendanceHistory(histRes.value.data);
            if (pyRes.status === 'fulfilled') setPayrolls(pyRes.value.data);
            else console.warn('Payroll fetch failed:', pyRes.reason?.message);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    }, [token, viewDate, API_URL]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        if (token) {
            fetchDashboardData();
        }
        return () => clearInterval(timer);
    }, [token, fetchDashboardData]);

    const handlePrevMonth = () => {
        const now = new Date();
        const currentTotalMonths = now.getFullYear() * 12 + now.getMonth();
        const viewTotalMonths = viewDate.getFullYear() * 12 + viewDate.getMonth();
        
        if (viewTotalMonths > currentTotalMonths - 4) {
            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        }
    };

    const handleNextMonth = () => {
        const now = new Date();
        const currentTotalMonths = now.getFullYear() * 12 + now.getMonth();
        const viewTotalMonths = viewDate.getFullYear() * 12 + viewDate.getMonth();
        
        if (viewTotalMonths < currentTotalMonths + 4) {
            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        }
    };

    const handleCheckIn = async () => {
        setError('');
        try {
            const res = await axios.post(`${API_URL}/attendance/check-in`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed');
        }
    };

    const handleCheckOut = async () => {
        setError('');
        try {
            const res = await axios.post(`${API_URL}/attendance/check-out`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-out failed');
        }
    };

    const renderContent = () => {
        const data = { timesheets, leaves, holidays, attendance, attendanceHistory };
        switch (activeTab) {
            case 'dashboard':
                return (
                    <DashboardHome
                        data={data}
                        time={time}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                        error={error}
                        viewDate={viewDate}
                        handlePrevMonth={handlePrevMonth}
                        handleNextMonth={handleNextMonth}
                    />
                );
            case 'attendance':
                return <TimesheetView timesheets={timesheets} fetchDashboardData={fetchDashboardData} />;
            case 'attendance_logs':
                return <AttendanceLogsView attendanceHistory={attendanceHistory} />;
            case 'leave':
                return <LeaveView leaves={leaves} fetchDashboardData={fetchDashboardData} />;
            case 'payroll':
                return <PayrollView payrolls={payrolls} user={user} />;
            case 'holidays':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Public Holidays</h2>

                        <div className="card" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-main)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>S.No</th>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holiday Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holidays.map((holiday, index) => (
                                        <tr key={holiday._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                                                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ color: '#64748b', fontSize: '14px' }}>{holiday.name}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {holidays.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No holidays found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );
            case 'settings':
                return <Settings />;
        }
    };


    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999
                        }}
                        className="mobile-only"
                    />
                )}
            </AnimatePresence>

            {/* Adjusted Sidebar for Responsiveness */}
            <div style={{
                position: 'relative',
                zIndex: 1000,
                display: 'flex',
                transition: 'transform 0.3s ease'
            }} className={isSidebarOpen ? '' : 'desktop-only'}>
                <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Mobile Header */}
                <header className="mobile-only" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: 'white',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 900
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={manshuLogo} alt="Logo" style={{ height: '32px', width: 'auto' }} />
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
