import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Lock, Link as LinkIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Settings = () => {
    const { user, token, changePassword } = useAuth();
    

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // System states
    const [templateUrl, setTemplateUrl] = useState('');
    
    // Status states
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemLoading, setSystemLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings/template_url`);
            setTemplateUrl(res.data.value);
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const res = await changePassword(user.email, currentPassword, newPassword);
        setLoading(false);

        if (res.success) {
            setSuccess(res.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError(res.message);
        }
    };

    const handleSystemSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSystemLoading(true);

        try {
            await axios.post(`${API_URL}/settings`, 
                { key: 'template_url', value: templateUrl },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setSuccess('System settings updated successfully');
            // Notify sidebar to refresh if possible, but for now, simple reload or state is enough
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update system settings');
        } finally {
            setSystemLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>Account Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your security and account preferences</p>
            </div>

            {/* Global Messages */}
            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            marginBottom: '24px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: error ? '#fef2f2' : '#f0fdf4',
                            color: error ? '#b91c1c' : '#15803d',
                            border: `1px solid ${error ? '#fee2e2' : '#dcfce7'}`,
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        {error || success}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* System Configurations (Admin Only) */}
            {user?.role === 'admin' && (
                <div className="card" style={{ padding: '32px', background: 'var(--bg-main)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ background: 'var(--primary-soft)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>System Configurations</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Global settings for the HR Cloud application</p>
                        </div>
                    </div>

                    <form onSubmit={handleSystemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Templates Link</label>
                            <div style={{ position: 'relative' }}>
                                <LinkIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="url"
                                    value={templateUrl}
                                    onChange={(e) => setTemplateUrl(e.target.value)}
                                    placeholder="https://example.com/templates"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--border)',
                                        outline: 'none',
                                        fontSize: '14px',
                                        background: 'var(--bg-subtle)'
                                    }}
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This link will be used when anyone clicks "Templates" in the sidebar.</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={systemLoading}
                                className="btn-primary"
                                style={{
                                    padding: '12px 32px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    opacity: systemLoading ? 0.7 : 1
                                }}
                            >
                                {systemLoading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Change Password */}
            <div className="card" style={{ padding: '32px', background: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ background: 'var(--primary-soft)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)' }}>Change Password</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Security verification required to update your password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--border)',
                                    outline: 'none',
                                    fontSize: '14px',
                                    background: 'var(--bg-subtle)'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--border)',
                                        outline: 'none',
                                        fontSize: '14px',
                                        background: 'var(--bg-subtle)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '10px',
                                        border: '1.5px solid var(--border)',
                                        outline: 'none',
                                        fontSize: '14px',
                                        background: 'var(--bg-subtle)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                padding: '12px 32px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: '600',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: '24px', padding: '24px', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>Active Session</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Logged in as <strong>{user?.email}</strong> ({user?.role})</span>
                </div>
            </div>
        </div>
    );
};

export default Settings;
