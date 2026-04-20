import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const isDanger = type === 'danger';

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                padding: '24px'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{
                        width: '100%',
                        maxWidth: '440px',
                        background: 'white',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        position: 'relative'
                    }}
                >
                    <button 
                        onClick={onCancel}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            background: isDanger ? '#fee2e2' : '#eff6ff',
                            color: isDanger ? '#ef4444' : '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            {isDanger ? <AlertTriangle size={32} /> : <Info size={32} />}
                        </div>

                        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                            {title}
                        </h3>
                        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 32px 0' }}>
                            {message}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={onCancel}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#64748b',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                                onMouseOut={(e) => e.target.style.background = 'white'}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: isDanger ? '#ef4444' : '#3b82f6',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    boxShadow: isDanger ? '0 10px 15px -3px rgba(239, 68, 68, 0.3)' : '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmDialog;
