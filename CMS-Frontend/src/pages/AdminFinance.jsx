import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';
import {
    PieChart, FileText, Users, CreditCard, Receipt,
    Plus, Edit, Trash2, Download, Eye, ArrowLeft, Building2,
    Calendar, CheckCircle, Clock, AlertCircle, Mail, Phone, MapPin, Printer, MoreVertical, Settings as SettingsIcon, BarChart as BarChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import manshuLogo from '../assets/manshu_logo.png';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const getBase64ImageFromUrl = async (imageUrl) => {
    return new Promise((resolve) => {
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = () => resolve(null); // Fallback gracefully
        img.src = imageUrl;
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
};

const BRAND_COLOR = '#2563eb'; // Blue
const BRAND_COLOR_LIGHT = '#eff6ff'; // Light Blue
const SUCCESS_COLOR = '#10b981';
const WARNING_COLOR = '#f59e0b';
const DANGER_COLOR = '#ef4444';

const getDefaultMonthlyData = () => {
    const data = [];
    for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        data.push({ month: d.toLocaleString('default', { month: 'short' }), revenue: 0, expenses: 0 });
    }
    return data;
};

// --- SUB-COMPONENTS --- //

const StatCard = ({ title, value, icon: Icon, gradient, subtitle }) => (
    <div style={{
        padding: '24px',
        background: gradient || 'white',
        color: gradient ? 'white' : 'var(--text-main)',
        borderRadius: '20px',
        boxShadow: gradient ? '0 10px 25px -5px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        border: gradient ? 'none' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: gradient ? 0.2 : 0.05, transform: 'scale(1.5)' }}>
            <Icon size={100} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '10px', background: gradient ? 'rgba(255,255,255,0.2)' : BRAND_COLOR_LIGHT, borderRadius: '12px', color: gradient ? 'white' : BRAND_COLOR }}>
                <Icon size={24} />
            </div>
            <p style={{ margin: 0, opacity: gradient ? 0.9 : 0.6, fontSize: '15px', fontWeight: '600' }}>{title}</p>
        </div>
        <h3 style={{ margin: 0, fontSize: '36px', fontWeight: '800', letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>{value}</h3>
        {subtitle && <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: gradient ? 0.8 : 0.5, position: 'relative', zIndex: 1 }}>{subtitle}</p>}
    </div>
);

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: '32px', width: '100%', maxWidth: '400px', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                    <AlertCircle size={32} />
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>{title}</h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: 'var(--text-muted)' }}>{message}</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '2px solid var(--border)', background: 'transparent', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '12px', border: 'none', background: '#dc2626', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>Delete</button>
                </div>
            </motion.div>
        </div>
    );
};

const FinanceDashboard = ({ stats }) => {
    const chartData = [
        { name: 'Revenue', value: stats?.totalRevenue || 0, color: BRAND_COLOR },
        { name: 'Expenses', value: stats?.totalExpenses || 0, color: DANGER_COLOR },
        { name: 'Pending', value: stats?.pendingPayments || 0, color: WARNING_COLOR }
    ];

    const monthlyData = stats?.monthlyData?.length ? stats.monthlyData : getDefaultMonthlyData();

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <img src={manshuLogo} alt="Manshu Logo" style={{ height: '48px', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Finance Overview</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Track your revenue, pending payments, and expenses in real-time.</p>
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue)} icon={PieChart} gradient={`linear-gradient(135deg, ${BRAND_COLOR} 0%, #1d4ed8 100%)`} subtitle="Overall earnings from all paid invoices" />
                <StatCard title="Pending Payments" value={formatCurrency(stats?.pendingPayments)} icon={AlertCircle} gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" subtitle="Awaiting collection from clients" />
                <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses)} icon={Receipt} subtitle="Business expenditures" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart size={20} color={BRAND_COLOR} /> Monthly Financial Growth
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BRAND_COLOR} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={BRAND_COLOR} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke={BRAND_COLOR} fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                                <Area type="monotone" dataKey="expenses" stroke={DANGER_COLOR} fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChart size={20} color={BRAND_COLOR} /> Distribution
                    </h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" iconType="circle" />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0', borderRadius: '20px', background: 'white', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} color={BRAND_COLOR} /> Recent Invoices
                    </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'white', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice #</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentInvoices?.map(inv => (
                                <tr key={inv._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '16px 24px', fontWeight: '700', color: BRAND_COLOR }}>{inv.invoiceNumber}</td>
                                    <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)' }}>{inv.clientId?.company || 'Unknown'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{new Date(inv.issueDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(inv.grandTotal)}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            background: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Overdue' ? '#fee2e2' : '#fef9c3',
                                            color: inv.status === 'Paid' ? '#166534' : inv.status === 'Overdue' ? '#991b1b' : '#854d0e',
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase'
                                        }}>{inv.status}</span>
                                    </td>
                                </tr>
                            ))}
                            {!stats?.recentInvoices?.length && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent invoices available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const FinanceClients = ({ token }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
    const [editingId, setEditingId] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            const res = await axios.get(`${API_URL}/finance/clients`, { headers: { Authorization: `Bearer ${token}` } });
            setClients(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_URL}/finance/clients/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/finance/clients`, formData, { headers: { Authorization: `Bearer ${token}` } });
            }
            setIsModalOpen(false);
            fetchClients();
        } catch (err) { console.error(err); }
    };

    const confirmDelete = (id) => {
        setClientToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if(clientToDelete) {
            await axios.delete(`${API_URL}/finance/clients/${clientToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchClients();
            setIsDeleteModalOpen(false);
            setClientToDelete(null);
        }
    };

    const openModal = (client = null) => {
        if (client) {
            setEditingId(client._id);
            setFormData(client);
        } else {
            setEditingId(null);
            setFormData({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Clients</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Manage your client directory and billing contacts.</p>
                </div>
                <button onClick={() => openModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                    <Plus size={18} /> Add Client
                </button>
            </div>
            
            <div className="card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company Details</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Person</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: BRAND_COLOR_LIGHT, color: BRAND_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                                            {client.company.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>{client.company}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <MapPin size={12} /> {client.address ? client.address.substring(0, 30) + '...' : 'No Address'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--text-main)' }}>
                                    <div style={{ fontWeight: '600' }}>{client.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Mail size={12} /> {client.email}</div>
                                    {client.phone && <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Phone size={12} /> {client.phone}</div>}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{client.status}</span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <button onClick={() => openModal(client)} style={{ background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', marginRight: '8px', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}><Edit size={16} /></button>
                                    <button onClick={() => confirmDelete(client._id)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fca5a5'} onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {!clients.length && <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Building2 size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No clients found</p>
                            <p style={{ fontSize: '14px', marginTop: '4px' }}>Add your first client to start billing.</p>
                        </td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: '32px', width: '100%', maxWidth: '550px', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>{editingId ? 'Edit Client Details' : 'Add New Client'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Company Name *</label>
                                    <input type="text" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Contact Person *</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address *</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Phone Number</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Billing Address</label>
                                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', minHeight: '100px', fontSize: '15px', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', border: '2px solid var(--border)', background: 'transparent', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Save Client Details</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            
            <ConfirmDeleteModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={executeDelete} 
                title="Delete Client" 
                message="Are you sure you want to permanently delete this client? This action cannot be undone." 
            />
        </div>
    );
};

const FinanceInvoices = ({ token, onEdit, onPreview, companyInfo }) => {
    const [invoices, setInvoices] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    useEffect(() => { fetchInvoices(); }, []);
    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${API_URL}/finance/invoices`, { headers: { Authorization: `Bearer ${token}` } });
            setInvoices(res.data);
        } catch(err) { console.error(err); }
    };

    const confirmDelete = (id) => {
        setInvoiceToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if(invoiceToDelete) {
            await axios.delete(`${API_URL}/finance/invoices/${invoiceToDelete}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchInvoices();
            setIsDeleteModalOpen(false);
            setInvoiceToDelete(null);
        }
    };
    const generatePDFDocument = async (invoice) => {
        const doc = new jsPDF();
        
        // Brand Colors
        const primaryColor = [37, 99, 235]; // #2563eb
        const darkText = [15, 23, 42]; // #0f172a
        const lightText = [100, 116, 139]; // #64748b
        
        // Header Rectangle
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 45, 'F');
        
        // Company Name / Logo Area
        const logoBase64 = await getBase64ImageFromUrl(manshuLogo);
        if (logoBase64) {
            // Adjust the width/height based on your logo's aspect ratio. Usually 40x12 or similar.
            // Putting a white background rectangle if the logo needs it, or just raw image if it's transparent PNG and looks good on blue
            // Let's draw it at x=14, y=10, width=45, height=25
            // But PNGs with transparency sometimes look bad directly, we'll draw a white rounded rect behind it just in case
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(12, 10, 50, 25, 2, 2, 'F');
            doc.addImage(logoBase64, 'PNG', 14, 12, 46, 21);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(26);
            doc.text("MANSHU LEARNING", 14, 25);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Professional EdTech Solutions", 14, 32);
        }

        // Invoice Meta Info (Top Right)
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE", 195, 22, { align: "right" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`# ${invoice.invoiceNumber}`, 195, 29, { align: "right" });
        doc.setFontSize(9);
        doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 195, 35, { align: "right" });
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 195, 40, { align: "right" });

        // Bill To Section
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Bill To:", 14, 60);
        doc.setFontSize(11);
        doc.text(invoice.clientId?.company || 'Unknown Client', 14, 67);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        if (invoice.clientId?.name) doc.text(invoice.clientId.name, 14, 73);
        if (invoice.clientId?.address) {
            const splitAddress = doc.splitTextToSize(invoice.clientId.address, 80);
            doc.text(splitAddress, 14, 79);
        }
        
        // Manshu Details (Right Side)
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("From:", 130, 60);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.text(companyInfo.name, 130, 67);
        if (companyInfo.address) {
            const splitAddr = doc.splitTextToSize(companyInfo.address, 70);
            doc.text(splitAddr, 130, 73);
        }
        const nextY = 73 + (doc.splitTextToSize(companyInfo.address || '', 70).length * 5);
        doc.text(companyInfo.email, 130, nextY);
        doc.text(companyInfo.phone, 130, nextY + 6);
        if (companyInfo.gstin) {
            doc.setFont("helvetica", "bold");
            doc.text(`GST: ${companyInfo.gstin}`, 130, nextY + 12);
        }

        // Line Items Table
        const tableData = invoice.items.map(item => [
            item.description, 
            item.quantity, 
            `${formatCurrency(item.price)}`, 
            `${formatCurrency(item.tax)}`, 
            `${formatCurrency(item.total)}`
        ]);
        
        autoTable(doc, {
            startY: 100,
            head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10, textColor: darkText },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 }
        });

        const finalY = doc.lastAutoTable?.finalY || 100;

        // Totals Section
        doc.setFillColor(248, 250, 252);
        doc.rect(120, finalY + 10, 76, 45, 'F');
        
        doc.setFontSize(10);
        doc.setTextColor(lightText[0], lightText[1], lightText[2]);
        doc.text("Subtotal:", 125, finalY + 20);
        doc.text("Tax Amount:", 125, finalY + 28);
        doc.text("Discount:", 125, finalY + 36);
        
        doc.setTextColor(darkText[0], darkText[1], darkText[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`${formatCurrency(invoice.subTotal)}`, 190, finalY + 20, { align: "right" });
        doc.text(`${formatCurrency(invoice.totalTax)}`, 190, finalY + 28, { align: "right" });
        doc.text(`-${formatCurrency(invoice.totalDiscount || 0)}`, 190, finalY + 36, { align: "right" });

        // Grand Total Line
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.line(125, finalY + 42, 190, finalY + 42);
        
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("Grand Total:", 125, finalY + 50);
        doc.text(`${formatCurrency(invoice.grandTotal)}`, 190, finalY + 50, { align: "right" });

        // Notes Section
        if (invoice.notes) {
            doc.setFontSize(11);
            doc.setTextColor(darkText[0], darkText[1], darkText[2]);
            doc.setFont("helvetica", "bold");
            doc.text("Notes / Terms:", 14, finalY + 20);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(lightText[0], lightText[1], lightText[2]);
            const splitNotes = doc.splitTextToSize(invoice.notes, 90);
            doc.text(splitNotes, 14, finalY + 28);
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("Thank you for your business with Manshu Learning.", 105, 280, { align: "center" });

        return doc;
    };

    const downloadPDF = async (invoice) => {
        const doc = await generatePDFDocument(invoice);
        doc.save(`${invoice.invoiceNumber}.pdf`);
    };

    const printInvoice = async (invoice) => {
        const doc = await generatePDFDocument(invoice);
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Invoices</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Manage, print, and track all your client invoices.</p>
                </div>
                <button onClick={() => onEdit(null)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                    <Plus size={18} /> Create New Invoice
                </button>
            </div>
            
            <div className="card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Details</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '800', color: BRAND_COLOR, fontSize: '15px', letterSpacing: '0.5px' }}>{inv.invoiceNumber}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} /> Issued: {new Date(inv.issueDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={12} /> Due: {new Date(inv.dueDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--text-main)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                            <Building2 size={16} />
                                        </div>
                                        {inv.clientId?.company || 'Unknown'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', fontWeight: '800', color: 'var(--text-main)', fontSize: '16px' }}>{formatCurrency(inv.grandTotal)}</td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{
                                        background: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Overdue' ? '#fee2e2' : inv.status === 'Pending' ? '#ffedd5' : '#f1f5f9',
                                        color: inv.status === 'Paid' ? '#166534' : inv.status === 'Overdue' ? '#991b1b' : inv.status === 'Pending' ? '#9a3412' : '#475569',
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>{inv.status}</span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => onPreview(inv)} title="Preview Invoice" style={{ background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}><Eye size={16} /></button>
                                        <button onClick={() => printInvoice(inv)} title="Print PDF" style={{ background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}><Printer size={16} /></button>
                                        <button onClick={() => downloadPDF(inv)} title="Download PDF" style={{ background: BRAND_COLOR_LIGHT, border: 'none', color: BRAND_COLOR, cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = BRAND_COLOR_LIGHT}><Download size={16} /></button>
                                        <button onClick={() => onEdit(inv)} title="Edit" style={{ background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}><Edit size={16} /></button>
                                        <button onClick={() => confirmDelete(inv._id)} title="Delete" style={{ background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fca5a5'} onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!invoices.length && <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No invoices yet</p>
                            <p style={{ fontSize: '14px', marginTop: '4px' }}>Create your first invoice to get started.</p>    
                        </td></tr>}
                    </tbody>
                </table>
            </div>
            <ConfirmDeleteModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={executeDelete} 
                title="Delete Invoice" 
                message="Are you sure you want to permanently delete this invoice? This action cannot be undone." 
            />
        </div>
    );
};

// ... Invoice Preview Modal ...
const InvoicePreviewModal = ({ invoice, onClose, companyInfo }) => {
    if(!invoice) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', width: '100%', maxWidth: '900px', height: '90vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                {/* Modal Header */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText color={BRAND_COLOR} /> Invoice Preview
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} style={{ padding: '8px 20px', border: '2px solid var(--border)', background: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-main)' }}>Close</button>
                    </div>
                </div>

                {/* Simulated A4 Paper */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '210mm', minHeight: '297mm', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative' }}>
                        
                        {/* Header Banner inside Paper */}
                        <div style={{ background: BRAND_COLOR, margin: '-40px -40px 40px -40px', padding: '40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ background: 'white', padding: '8px', borderRadius: '8px', display: 'inline-block' }}>
                                <img src={manshuLogo} alt="Manshu Learning" style={{ height: '40px', objectFit: 'contain' }} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '900', letterSpacing: '2px' }}>INVOICE</h2>
                                <p style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: '600' }}># {invoice.invoiceNumber}</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '12px' }}>Bill To</h4>
                                <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)' }}>{invoice.clientId?.company || 'Unknown Client'}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', lineHeight: '1.6' }}>
                                    {invoice.clientId?.name && <div>{invoice.clientId.name}</div>}
                                    {invoice.clientId?.address && <div style={{ maxWidth: '250px' }}>{invoice.clientId.address}</div>}
                                    {invoice.clientId?.email && <div>{invoice.clientId.email}</div>}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '12px' }}>Details</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 24px', textAlign: 'left' }}>
                                    <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Issue Date:</div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', textAlign: 'right' }}>{new Date(invoice.issueDate).toLocaleDateString()}</div>
                                    <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Due Date:</div>
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: DANGER_COLOR, textAlign: 'right' }}>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                                    <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Status:</div>
                                    <div style={{ fontWeight: '800', fontSize: '14px', textAlign: 'right', color: invoice.status === 'Paid' ? SUCCESS_COLOR : WARNING_COLOR, textTransform: 'uppercase' }}>{invoice.status}</div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid ' + BRAND_COLOR }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: BRAND_COLOR, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Description</th>
                                    <th style={{ padding: '12px', textAlign: 'center', color: BRAND_COLOR, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Qty</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: BRAND_COLOR, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Price</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: BRAND_COLOR, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Tax</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: BRAND_COLOR, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '16px 12px', fontWeight: '600' }}>{item.description}</td>
                                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>{formatCurrency(item.tax)}</td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '800' }}>{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Box */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '40px' }}>
                                {invoice.notes && (
                                    <>
                                        <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '8px' }}>Notes / Terms</h4>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>{invoice.notes}</p>
                                    </>
                                )}
                            </div>
                            <div style={{ width: '320px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Subtotal:</span>
                                    <span style={{ fontWeight: '700' }}>{formatCurrency(invoice.subTotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Total Tax:</span>
                                    <span style={{ fontWeight: '700' }}>{formatCurrency(invoice.totalTax)}</span>
                                </div>
                                {invoice.totalDiscount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Discount:</span>
                                        <span style={{ fontWeight: '700', color: DANGER_COLOR }}>-{formatCurrency(invoice.totalDiscount)}</span>
                                    </div>
                                )}
                                <div style={{ height: '1px', background: '#cbd5e1', margin: '16px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '900', color: BRAND_COLOR }}>Grand Total:</span>
                                    <span style={{ fontSize: '24px', fontWeight: '900', color: BRAND_COLOR }}>{formatCurrency(invoice.grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Branding */}
                        <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                            {companyInfo.name} | {companyInfo.email} | {companyInfo.phone} {companyInfo.gstin ? `| GST: ${companyInfo.gstin}` : ''}
                        </div>

                    </div>
                </div>
            </motion.div>
        </div>
    )
}

const CreateInvoice = ({ token, invoiceToEdit, onGoBack }) => {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        clientId: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'Draft',
        notes: '',
        items: [{ description: '', quantity: 1, price: 0, tax: 0, discount: 0, total: 0 }]
    });

    useEffect(() => {
        axios.get(`${API_URL}/finance/clients`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setClients(res.data));
        if (invoiceToEdit) {
            setFormData({
                ...invoiceToEdit,
                clientId: invoiceToEdit.clientId?._id || invoiceToEdit.clientId,
                issueDate: new Date(invoiceToEdit.issueDate).toISOString().split('T')[0],
                dueDate: new Date(invoiceToEdit.dueDate).toISOString().split('T')[0]
            });
        }
    }, [invoiceToEdit]);

    const calculateTotals = (items) => {
        let subTotal = 0; let totalTax = 0; let totalDiscount = 0;
        items.forEach(item => {
            const itemTotal = (item.quantity * item.price) - item.discount + item.tax;
            item.total = itemTotal;
            subTotal += (item.quantity * item.price);
            totalTax += item.tax;
            totalDiscount += item.discount;
        });
        const grandTotal = subTotal + totalTax - totalDiscount;
        return { items, subTotal, totalTax, totalDiscount, grandTotal };
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = Number(value) || value;
        const totals = calculateTotals(newItems);
        setFormData({ ...formData, ...totals });
    };

    const addItem = () => {
        const newItems = [...formData.items, { description: '', quantity: 1, price: 0, tax: 0, discount: 0, total: 0 }];
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        if(formData.items.length <= 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, ...calculateTotals(newItems) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (invoiceToEdit) {
                await axios.put(`${API_URL}/finance/invoices/${invoiceToEdit._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_URL}/finance/invoices`, formData, { headers: { Authorization: `Bearer ${token}` } });
            }
            onGoBack();
        } catch (err) { alert('Failed to save invoice'); }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '40px', borderRadius: '24px', background: 'white', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '2px solid #f8fafc', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onGoBack} style={{ background: 'var(--bg-subtle)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-main)', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'} onMouseLeave={e=>e.currentTarget.style.background='var(--bg-subtle)'}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px', color: 'var(--text-main)' }}>{invoiceToEdit ? 'Edit Invoice' : 'Create New Invoice'}</h2>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Fill in the details to generate a professional invoice.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>Client Info</label>
                        <select required value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid var(--border)', background: 'white', fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>
                            <option value="">Select a Client...</option>
                            {clients.map(c => <option key={c._id} value={c._id}>{c.company} ({c.name})</option>)}
                        </select>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>INVOICE # (Optional)</label>
                        <input type="text" placeholder="Auto Generated if blank" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '14px' }} />
                    </div>
                    
                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>Dates & Status</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>ISSUE DATE</label>
                                <input type="date" required value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', fontWeight: '600' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>DUE DATE</label>
                                <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', fontWeight: '600', color: DANGER_COLOR }} />
                            </div>
                        </div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>STATUS</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontSize: '14px', fontWeight: '700' }}>
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>

                <div style={{ border: '2px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={18} color={BRAND_COLOR} /> <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Line Items</h4>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', width: '40%', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Qty</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Price (₹)</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tax (₹)</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Line Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody style={{ background: '#f8fafc' }}>
                            {formData.items.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input type="text" placeholder="Item description..." required value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: '600' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input type="number" required min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', textAlign: 'center' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input type="number" required min="0" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <input type="number" min="0" value={item.tax} onChange={e => handleItemChange(index, 'tax', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }} />
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: '800', color: BRAND_COLOR, fontSize: '15px' }}>
                                        {formatCurrency(item.total)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <button type="button" onClick={() => removeItem(index)} style={{ background: 'white', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'} onMouseLeave={e=>e.currentTarget.style.background='white'}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '16px', background: 'white', borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={addItem} style={{ background: BRAND_COLOR_LIGHT, border: 'none', color: BRAND_COLOR, fontWeight: '700', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'} onMouseLeave={e=>e.currentTarget.style.background=BRAND_COLOR_LIGHT}>
                            <Plus size={16} strokeWidth={3} /> Add New Line Item
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>Notes & Terms</label>
                        <textarea placeholder="Add any special notes, payment terms, or instructions..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid var(--border)', background: '#f8fafc', minHeight: '130px', fontSize: '14px', resize: 'vertical' }} />
                    </div>

                    <div style={{ width: '380px', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Subtotal:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(formData.subTotal || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '15px' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Total Tax:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatCurrency(formData.totalTax || 0)}</span>
                        </div>
                        <div style={{ height: '2px', background: '#cbd5e1', margin: '20px 0', borderRadius: '2px' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '900', fontSize: '20px', color: 'var(--text-main)' }}>Grand Total:</span>
                            <span style={{ fontWeight: '900', fontSize: '28px', color: BRAND_COLOR, letterSpacing: '-1px' }}>{formatCurrency(formData.grandTotal || 0)}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px solid #f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button type="button" onClick={onGoBack} style={{ padding: '16px 32px', border: '2px solid var(--border)', background: 'white', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', color: 'var(--text-main)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ padding: '16px 40px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
                        <CheckCircle size={20} /> Save & Finalize Invoice
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

const FinancePayments = ({ token }) => {
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ invoiceId: '', clientId: '', amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer' });

    useEffect(() => {
        fetchPayments();
        axios.get(`${API_URL}/finance/invoices`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setInvoices(res.data.filter(i => i.status !== 'Paid')));
        axios.get(`${API_URL}/finance/clients`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setClients(res.data));
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await axios.get(`${API_URL}/finance/payments`, { headers: { Authorization: `Bearer ${token}` } });
            setPayments(res.data);
        } catch(err) { console.error(err); }
    };

    const handleInvoiceSelect = (invId) => {
        const inv = invoices.find(i => i._id === invId);
        if(inv) {
            setFormData({ ...formData, invoiceId: invId, clientId: inv.clientId._id, amount: inv.grandTotal });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/finance/payments`, formData, { headers: { Authorization: `Bearer ${token}` } });
            setIsModalOpen(false);
            fetchPayments();
        } catch (err) { alert('Failed'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Payments Received</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Track incoming transactions and settle invoices.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                    <Plus size={18} /> Record New Payment
                </button>
            </div>
            
            <div className="card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Link</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Method</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Settled</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontWeight: '500' }}>{new Date(p.date).toLocaleDateString()}</td>
                                <td style={{ padding: '20px 24px', fontWeight: '700', color: BRAND_COLOR }}>{p.invoiceId?.invoiceNumber || 'Unknown'}</td>
                                <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--text-main)' }}>{p.clientId?.company || 'Unknown'}</td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{p.method}</span>
                                </td>
                                <td style={{ padding: '20px 24px', fontWeight: '800', color: SUCCESS_COLOR, fontSize: '16px' }}>+ {formatCurrency(p.amount)}</td>
                            </tr>
                        ))}
                        {!payments.length && <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <CreditCard size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No payments recorded yet</p>
                        </td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: '32px', width: '100%', maxWidth: '500px', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Record Payment</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Select Pending Invoice</label>
                                <select required value={formData.invoiceId} onChange={e => handleInvoiceSelect(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }}>
                                    <option value="">Choose an invoice...</option>
                                    {invoices.map(i => <option key={i._id} value={i._id}>{i.invoiceNumber} - {i.clientId?.company}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount Received</label>
                                <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '700', color: SUCCESS_COLOR }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Payment Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Payment Method</label>
                                    <select required value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }}>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Online">Online/UPI</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', border: '2px solid var(--border)', background: 'transparent', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Confirm Payment</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};


const FinanceExpenses = ({ token }) => {
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', amount: '', category: 'Software', date: new Date().toISOString().split('T')[0] });

    useEffect(() => { fetchExpenses(); }, []);

    const fetchExpenses = async () => {
        const res = await axios.get(`${API_URL}/finance/expenses`, { headers: { Authorization: `Bearer ${token}` } });
        setExpenses(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post(`${API_URL}/finance/expenses`, formData, { headers: { Authorization: `Bearer ${token}` } });
        setIsModalOpen(false);
        fetchExpenses();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Business Expenses</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Log and monitor your company spending.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                    <Plus size={18} /> Log Expense
                </button>
            </div>
            <div className="card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                                <td style={{ padding: '20px 24px', color: 'var(--text-muted)', fontWeight: '500' }}>{new Date(exp.date).toLocaleDateString()}</td>
                                <td style={{ padding: '20px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{exp.description}</td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{exp.category}</span>
                                </td>
                                <td style={{ padding: '20px 24px', fontWeight: '800', color: DANGER_COLOR, fontSize: '16px' }}>- {formatCurrency(exp.amount)}</td>
                            </tr>
                        ))}
                        {!expenses.length && <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Receipt size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No expenses logged</p>
                        </td></tr>}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: '32px', width: '100%', maxWidth: '500px', borderRadius: '24px', background: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Log New Expense</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Description</label>
                                <input type="text" placeholder="What was this expense for?" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount</label>
                                    <input type="number" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '700', color: DANGER_COLOR }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
                                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }}>
                                        <option value="Software">Software & IT</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Office">Office Supplies</option>
                                        <option value="Travel">Travel & Meals</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', border: '2px solid var(--border)', background: 'transparent', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>Save Expense</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const FinanceReports = ({ stats }) => {
    const data = stats?.monthlyData?.length ? stats.monthlyData : getDefaultMonthlyData();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Financial Reports</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Detailed analysis of your business performance.</p>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'white', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '32px', color: 'var(--text-main)' }}>Revenue vs Expenses (Last 5 Months)</h3>
                <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: '600' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                            <Bar dataKey="revenue" fill={BRAND_COLOR} radius={[6, 6, 0, 0]} barSize={30} />
                            <Bar dataKey="expenses" fill={DANGER_COLOR} radius={[6, 6, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const FinanceSettings = ({ companyInfo, setCompanyInfo }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        localStorage.setItem('manshu_finance_company_info', JSON.stringify(companyInfo));
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Finance Settings</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Configure your business profile and invoice defaults.</p>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'white', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '24px', background: '#f8fafc', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img src={manshuLogo} alt="Company Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        </div>
                        <button style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: BRAND_COLOR, color: 'white', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
                            <Edit size={16} />
                        </button>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>Company Branding</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>This logo will appear on all your generated invoices.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Company Name</label>
                            <input type="text" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '600' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Official Email</label>
                            <input type="email" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '600' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Phone Number</label>
                            <input type="text" value={companyInfo.phone} onChange={e => setCompanyInfo({...companyInfo, phone: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '600' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>GSTIN / TAX ID</label>
                            <input type="text" value={companyInfo.gstin} onChange={e => setCompanyInfo({...companyInfo, gstin: e.target.value})} placeholder="27XXXXX0000X1Z5" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '600', textTransform: 'uppercase' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>Business Address</label>
                            <textarea value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '15px', fontWeight: '600', minHeight: '115px' }} />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSave} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
                        <CheckCircle size={20} /> {isSaving ? 'Saved Successfully!' : 'Save Business Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN MODULE CONTAINER --- //

const AdminFinance = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [companyInfo, setCompanyInfo] = useState(() => {
        const saved = localStorage.getItem('manshu_finance_company_info');
        if (saved) return JSON.parse(saved);
        return {
            name: 'Manshu Learning Pvt. Ltd.',
            email: 'contact@manshulearning.com',
            phone: '+91 98765 43210',
            address: '123 EdTech Valley, Tech Park, Bangalore, KA 560001',
            gstin: '29ABCDE1234F1Z5'
        };
    });

    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [invoiceToEdit, setInvoiceToEdit] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);

    useEffect(() => {
        if (activeTab === 'dashboard' || activeTab === 'reports') {
            axios.get(`${API_URL}/finance/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setStats(res.data))
                .catch(err => console.error(err));
        }
    }, [activeTab, token]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: PieChart },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
        { id: 'reports', label: 'Reports', icon: BarChartIcon },
        { id: 'settings', label: 'Settings', icon: SettingsIcon }
    ];

    const renderContent = () => {
        if (activeTab === 'create-invoice') return <CreateInvoice token={token} invoiceToEdit={invoiceToEdit} onGoBack={() => { setInvoiceToEdit(null); setActiveTab('invoices'); }} />;
        switch (activeTab) {
            case 'dashboard': return <FinanceDashboard stats={stats} />;
            case 'invoices': return <FinanceInvoices token={token} onEdit={(inv) => { setInvoiceToEdit(inv); setActiveTab('create-invoice'); }} onPreview={setPreviewInvoice} companyInfo={companyInfo} />;
            case 'clients': return <FinanceClients token={token} />;
            case 'payments': return <FinancePayments token={token} />;
            case 'expenses': return <FinanceExpenses token={token} />;
            case 'reports': return <FinanceReports stats={stats} />;
            case 'settings': return <FinanceSettings companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />;
            default: return <div>Coming Soon</div>;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1, minHeight: 0, paddingBottom: '40px' }}>
            {/* Beautiful Top Navigation */}
            <div style={{ display: 'flex', gap: '8px', padding: '8px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setInvoiceToEdit(null); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === tab.id ? BRAND_COLOR_LIGHT : 'transparent',
                            color: activeTab === tab.id ? BRAND_COLOR : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? '800' : '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === tab.id ? 'inset 0 0 0 1px rgba(37,99,235,0.1)' : 'none'
                        }}
                        onMouseEnter={e => { if(activeTab !== tab.id) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if(activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
                    >
                        <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {previewInvoice && <InvoicePreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} companyInfo={companyInfo} />}
        </div>
    );
};

export default AdminFinance;
