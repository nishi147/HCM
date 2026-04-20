import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please provide both email and password');
            return;
        }

        const res = await login(email, password);
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
            height: '100vh',
            background: 'var(--bg-subtle)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    background: 'var(--bg-main)',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'inline-block',
                    marginBottom: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Building2 size={32} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>HR Cloud</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome back to your dashboard</p>
            </div>

            <div style={{
                background: 'var(--bg-main)',
                padding: '32px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)'
            }}>
                <h2 style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign in as</h2>

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
                                    borderRadius: '12px',
                                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--primary-soft)' : 'var(--bg-main)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}>
                                    <Icon size={18} />
                                </div>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{role.label}</h3>
                            </motion.div>
                        );
                    })}
                </div>

                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                outline: 'none',
                                background: 'var(--bg-subtle)',
                                fontSize: '14px',
                                color: 'var(--text-main)'
                            }}
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
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
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            marginTop: '8px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        <span>Sign In</span>
                        <ArrowRight size={18} />
                    </button>
                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                marginTop: '16px',
                                padding: '12px',
                                borderRadius: '8px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                fontSize: '13px',
                                textAlign: 'center',
                                fontWeight: '500'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;
