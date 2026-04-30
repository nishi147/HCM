import API_URL from '../utils/api';
import {
    LayoutGrid,
    Clock,
    Calendar,
    Gift,
    DollarSign,
    FileText,
    Users,
    LogOut,
    ChevronRight,
    BarChart3,
    Briefcase,
    X,
    ClipboardCheck,
    KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import manshuLogo from '../assets/manshu_logo.png';

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [templateUrl, setTemplateUrl] = useState('https://www.portfolio.manshulearning.com/admin');
    

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/settings/template_url`);
                if (res.data.value) {
                    setTemplateUrl(res.data.value);
                }
            } catch (err) {
                console.error('Error fetching template URL:', err);
            }
        };
        fetchSettings();
    }, []);

    const menuItems = user?.role === 'admin' ? [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'attendance', label: 'Timesheets', icon: Clock },
        { id: 'leave', label: 'Leave Requests', icon: Calendar },
        { id: 'holidays', label: 'Holidays', icon: Gift },
        { id: 'projects', label: 'Manage Projects', icon: Briefcase },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'settings', label: 'Settings', icon: KeyRound },
        { id: 'templates', label: 'Templates', icon: FileText, isExternal: true, url: templateUrl },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'attendance', label: 'Timesheets', icon: Clock },
        { id: 'attendance_logs', label: 'Attendance Logs', icon: ClipboardCheck },
        { id: 'leave', label: 'Leave & Comp Off', icon: Calendar },
        { id: 'holidays', label: 'Holidays', icon: Gift },
        { id: 'payroll', label: 'My Payroll', icon: DollarSign },
        { id: 'settings', label: 'Settings', icon: KeyRound },
        { id: 'templates', label: 'Templates', icon: FileText, isExternal: true, url: templateUrl },
    ];

    return (
        <div className="card sidebar-container" style={{ 
            width: '280px', 
            height: 'calc(100vh - 32px)', 
            margin: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '24px', 
            position: 'sticky', 
            top: '16px',
            zIndex: 1000,
            transition: 'transform 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingLeft: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                    {/* 🔥 ONLY LOGO (TEXT REMOVED) */}
                <img 
    src={manshuLogo} 
    alt="logo"
    style={{ 
        height: '90px',
        width: '200px',
        objectFit: 'contain'
    }} 
/>
                </div>
                
                {onClose && (
                    <button onClick={onClose} className="mobile-only" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px',
                overflowY: 'auto',
                paddingRight: '4px',
                marginBottom: '16px',
                scrollbarWidth: 'thin'
            }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.isExternal) {
                                    window.open(item.url, '_blank', 'noopener,noreferrer');
                                } else {
                                    setActiveTab(item.id);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isActive ? 'var(--primary-soft)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                width: '100%',
                                fontWeight: isActive ? '600' : '500',
                                flexShrink: 0
                            }}
                        >
                            <Icon size={18} />
                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                            {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingLeft: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'var(--text-main)' }}>
                        {user?.name?.[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{user?.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
