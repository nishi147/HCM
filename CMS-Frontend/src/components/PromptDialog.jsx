import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const PromptDialog = ({ isOpen, title, message, placeholder, onConfirm, onCancel, defaultValue = '' }) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) setValue(defaultValue);
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onConfirm(value.trim());
        }
    };

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
                            background: '#eff6ff',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            <Edit3 size={32} />
                        </div>

                        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                            {title}
                        </h3>
                        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                            {message}
                        </p>

                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <input
                                autoFocus
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={placeholder}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: '2px solid #e2e8f0',
                                    background: '#f8fafc',
                                    outline: 'none',
                                    fontSize: '15px',
                                    color: '#1e293b',
                                    marginBottom: '32px',
                                    transition: 'all 0.2s',
                                    fontWeight: '500'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <button
                                    type="button"
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: '#3b82f6',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                    }}
                                >
                                    Add Now
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PromptDialog;
