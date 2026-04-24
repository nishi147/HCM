import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, User, FileText, Check, X, Search, CreditCard, TrendingUp, AlertCircle, Trash2, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPayroll = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        base: 0,
        bonus: 0,
        extraDays: 0,
        tax: 0,
        deductions: 0
    });

    const { token } = useAuth();
    

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payrollRes, employeeRes, leaveRes, holidayRes] = await Promise.all([
                axios.get(`${API_URL}/payroll/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/leaves/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/holidays`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPayrolls(payrollRes.data);
            setEmployees(employeeRes.data.filter(emp => emp.role === 'employee'));
            setLeaves(leaveRes.data);
            setHolidays(holidayRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching payroll data:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/payroll/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error updating payroll status:', err);
        }
    };

    const calculateAutoDeduction = (userId, mIndex, yr) => {
        if (!userId || mIndex === undefined || !yr) return 0;

        const selectedEmp = employees.find(e => e._id === userId);
        if (!selectedEmp) return 0;

        const approvedLeaves = leaves.filter(l =>
            String(l.userId?._id || l.userId) === String(userId) &&
            l.status === 'Approved' &&
            l.type === 'Unpaid Leave'
        );

        let unpaidValue = 0;
        const monthIndex = parseInt(mIndex);
        const year = parseInt(yr);

        approvedLeaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);

            // Iterate through each day of the leave
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Only count if it's in the target month/year
                if (d.getMonth() === monthIndex && d.getFullYear() === year) {
                    const dateStr = d.toISOString().split('T')[0];
                    const holiday = holidays.find(h => h.date === dateStr);

                    if (holiday) {
                        if (holiday.type === 'Half Day') unpaidValue += 0.5;
                    } else {
                        if (leave.dayType === 'Half Day') unpaidValue += 0.5;
                        else unpaidValue += 1;
                    }
                }
            }
        });

        if (unpaidValue > 0) {
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const deduction = ((selectedEmp.baseSalary || 0) / daysInMonth) * unpaidValue;
            return Math.round(deduction);
        }
        return 0;
    };

    const handleEmployeeSelect = (userId) => {
        const selectedEmp = employees.find(emp => emp._id === userId);
        const base = selectedEmp ? (selectedEmp.baseSalary || 0) : 0;

        // Use current month/year if not set
        const m = formData.month || new Date().getMonth();
        const y = formData.year || new Date().getFullYear();

        const ded = calculateAutoDeduction(userId, m, y);
        setFormData({ ...formData, userId, base, deductions: ded, month: m, year: y });
    };

    const handleDateChange = (type, value) => {
        const newMonth = type === 'month' ? value : formData.month;
        const newYear = type === 'year' ? value : formData.year;
        const ded = calculateAutoDeduction(formData.userId, newMonth, newYear);
        
        // Recalculate bonus if extraDays exists
        let newBonus = formData.bonus;
        if (formData.userId && formData.extraDays > 0) {
            const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
            newBonus = Math.round((formData.base / daysInMonth) * formData.extraDays);
        }

        setFormData({ ...formData, month: newMonth, year: newYear, deductions: ded, bonus: newBonus });
    };

    const handleExtraDaysChange = (days) => {
        const extraDays = Number(days);
        let bonus = formData.bonus;
        
        if (formData.userId && extraDays >= 0) {
            const daysInMonth = new Date(formData.year, formData.month + 1, 0).getDate();
            bonus = Math.round((formData.base / daysInMonth) * extraDays);
        }
        
        setFormData({ ...formData, extraDays, bonus });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const payrollData = {
                ...formData,
                month: `${months[formData.month]} ${formData.year}`
            };
            await axios.post(`${API_URL}/payroll`, payrollData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFormOpen(false);
            setFormData({
                userId: '',
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                base: 0,
                bonus: 0,
                extraDays: 0,
                tax: 0,
                deductions: 0
            });
            fetchData();
        } catch (err) {
            console.error('Error creating payroll:', err);
        }
    };

    // Summary Stats
    const totalPaid = (payrolls || [])
        .filter(p => p && p.status === 'Paid')
        .reduce((acc, curr) => acc + (curr.netPay || 0), 0);

    const pendingPayroll = (payrolls || [])
        .filter(p => p && p.status === 'Pending')
        .reduce((acc, curr) => acc + (curr.netPay || 0), 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredPayrolls = payrolls.filter(p =>
        p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.month).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Payroll Management</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px 16px 10px 48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'white',
                                fontSize: '14px',
                                width: '100%',
                                fontWeight: '500'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="btn-primary"
                        style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        <span style={{ fontWeight: '600' }}>{isFormOpen ? 'Close Entry' : 'Manual Entry'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <motion.div
                    whileHover={{ y: -4 }}
                    className="card"
                    style={{
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        borderRadius: '16px'
                    }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <span style={{ fontSize: '20px', fontWeight: '800' }}>₹</span>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{formatCurrency(totalPaid)}</h3>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    className="card"
                    style={{
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #fffcf5 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        borderRadius: '16px'
                    }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Payroll</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{formatCurrency(pendingPayroll)}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Manual Entry Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Generate Payroll Entry</h3>
                                <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Employee</label>
                                        <select
                                            required
                                            value={formData.userId}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none' }}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Month/Year</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <select
                                                required
                                                value={formData.month}
                                                onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                                                style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none' }}
                                            >
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                    <option key={m} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                required
                                                value={formData.year}
                                                onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                                                style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', outline: 'none' }}
                                            >
                                                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '8px', display: 'block' }}>Base Salary (₹)</label>
                                        <input type="number" required value={formData.base} onChange={(e) => setFormData({ ...formData, base: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #dcfce7', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '8px', display: 'block' }}>Bonus (₹)</label>
                                        <input type="number" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #dcfce7', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', marginBottom: '8px', display: 'block' }}>Tax (₹)</label>
                                        <input type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fee2e2', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', marginBottom: '8px', display: 'block' }}>Deductions (₹)</label>
                                        <input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #fee2e2', outline: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'var(--primary)', borderRadius: '16px', color: 'white', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <p style={{ fontSize: '11px', fontWeight: '600', opacity: 0.8, margin: 0 }}>NET PAY</p>
                                        <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{formatCurrency(formData.base + formData.bonus - formData.tax - formData.deductions)}</h3>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ background: 'white', color: 'var(--primary)', padding: '10px 24px', fontSize: '14px', fontWeight: '700' }}>
                                        Generate Payroll
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payroll Table Container */}
            <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                border: '1px solid var(--border)', 
                borderRadius: '16px', 
                background: 'var(--bg-main)', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                maxHeight: isFormOpen ? 'calc(100vh - 480px)' : 'calc(100vh - 200px)',
                transition: 'max-height 0.3s ease'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Fetching payroll data...</p>
                    </div>
                ) : filteredPayrolls.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No payroll records found.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '1100px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Employee</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Month</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Status</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Base</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Bonus</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Adjustments</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Net Pay</th>
                                <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayrolls.map((payroll) => (
                                <tr key={payroll._id} className="table-row-hover" style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                                                {payroll.userId?.name?.[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{payroll.userId?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{payroll.month}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{
                                            background: payroll.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                                            color: payroll.status === 'Paid' ? '#16a34a' : '#f59e0b',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            border: `1px solid ${payroll.status === 'Paid' ? '#dcfce7' : '#fef3c7'}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {payroll.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>₹{(payroll.base || 0).toLocaleString()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px' }}>+₹{(payroll.bonus || 0).toLocaleString()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '11px' }}>Tax: -₹{(payroll.tax || 0).toLocaleString()}</span>
                                            <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '11px' }}>Ded: -₹{(payroll.deductions || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px' }}>₹{(payroll.netPay || 0).toLocaleString()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                                        {payroll.status === 'Pending' ? (
                                            <button
                                                onClick={() => handleStatusUpdate(payroll._id, 'Paid')}
                                                style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}
                                            >
                                                Mark Paid
                                            </button>
                                        ) : (
                                            <Check size={20} style={{ color: '#16a34a', marginLeft: 'auto' }} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
        </div>
    );
};

export default AdminPayroll;
