import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import manshuLogo from '../assets/manshu_logo.png';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const roles = [
        {
            id: 'employee',
            label: 'Employee',
            icon: User,
            color: '#3b82f6'
        },
        {
            id: 'admin',
            label: 'Admin',
            icon: Shield,
            color: '#0f172a'
        }
    ];

    const handleRoleSelect = (role) => {
        setSelectedRole(role.id);
        setError('');
        if (role.id === 'admin') {
            setEmail('admin@manshulearning.com');
        } else {
            setEmail('');
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please provide both email and password');
            return;
        }

        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--bg-subtle)',
            padding: '20px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    background: 'var(--bg-main)',
                    padding: '8px',
                    borderRadius: '16px',
                    display: 'inline-block',
                    marginBottom: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <img src={manshuLogo} alt="Manshu Learning" style={{ height: '64px', width: 'auto', borderRadius: '12px' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.02em' }}>HR Cloud</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome back to your dashboard</p>
            </div>

            <div style={{
                background: 'var(--bg-main)',
                padding: '32px',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <h2 style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sign in as</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                            <motion.div
                                key={role.id}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRoleSelect(role)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--primary-soft)' : 'var(--bg-main)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}>
                                    <Icon size={20} />
                                </div>
                                <h3 style={{ fontSize: '14px', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>{role.label}</h3>
                            </motion.div>
                        );
                    })}
                </div>

                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                background: 'var(--bg-subtle)',
                                fontSize: '14px',
                                color: 'var(--text-main)',
                                transition: 'border-color 0.2s'
                            }}
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                background: 'var(--bg-subtle)',
                                fontSize: '14px',
                                color: 'var(--text-main)'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1,
                            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                        {!loading && <ArrowRight size={18} />}
                    </button>

                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            style={{
                                marginTop: '20px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                color: '#b91c1c',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: '600'
                            }}
                        >
                            <span style={{ flex: 1 }}>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
