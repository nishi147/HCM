import API_URL from '../utils/api';
import manshuLogo from '../assets/manshu_logo.png';
import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Printer, Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, numberToWords } from '../utils/formatters';

const PaySlipModal = ({ payroll, user: employee, dynamicEmployeeId, onClose }) => {
    const { user: currentUser, token } = useAuth();
    const [address, setAddress] = useState('India 500000 India');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAddress();
    }, []);

    const fetchAddress = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings/payslip_address`);
            if (res.data && res.data.value) {
                setAddress(res.data.value);
            }
        } catch (err) {
            console.error('Error fetching address:', err);
        }
    };

    const handleSaveAddress = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/settings`, 
                { key: 'payslip_address', value: newAddress },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setAddress(newAddress);
            setIsEditingAddress(false);
        } catch (err) {
            console.error('Failed to update address:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const element = document.getElementById('printable-payslip');
        const opt = {
            margin:       10,
            filename:     `PaySlip_${payroll.month}_${employee?.name || 'Employee'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: [210, 350], orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    // Calculation logic for days
    const monthYear = payroll.month.split(' ');
    const daysInMonth = monthYear.length === 2 ? new Date(monthYear[1], ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthYear[0]) + 1, 0).getDate() : 30;
    
    // Estimate LOP Days based on deductions
    const dailyRate = payroll.base / daysInMonth;
    const lopDays = Math.max(0, Math.round((payroll.deductions || 0) / dailyRate));
    const paidDays = daysInMonth - lopDays;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '98vh', overflowY: 'auto', background: 'white', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
                <div className="no-print" style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <FileText size={16} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Payslip Statement</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                            <Printer size={14} /> Download PDF
                        </button>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#64748b', fontSize: '12px' }}>Close</button>
                    </div>
                </div>

                <div id="printable-payslip" style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={manshuLogo} alt="Logo" style={{ height: '36px', width: 'auto' }} />
                            <div>
                                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Manshu Learning</h1>
                                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{address}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Payslip For the Month</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{payroll.month}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: '1.2', minWidth: '300px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Employee Summary</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Employee Name</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>: {payroll?.userId?.name || employee?.name || 'Unknown'}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Employee ID</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>: {dynamicEmployeeId || payroll?.userId?.employeeId || employee?.employeeId || '1234'}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Pay Period</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>: {payroll.month}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>Pay Date</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>: {new Date(payroll.paymentDate || payroll.createdAt || new Date()).toLocaleDateString('en-GB')}</span>
                            </div>
                        </div>

                        <div style={{ flex: '0.8', minWidth: '300px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '12px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#22c55e' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>Total Net Pay</span>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#166534', margin: '2px 0' }}>{formatCurrency(payroll.netPay)}</h2>
                            <span style={{ fontSize: '11px', color: '#15803d', opacity: 0.8, fontWeight: '600' }}>Total Net Pay</span>
                            
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #dcfce7' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>Paid Days</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>: {paidDays}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>LOP Days</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>: {lopDays}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ flex: '1', minWidth: '300px', padding: '12px', borderRight: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Earnings</span>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Amount</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>Basic</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.base)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>Bonus</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.bonus || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>House Rent Allowance</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.houseRentAllowance || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                                <span style={{ fontWeight: '700', color: '#1e293b' }}>Gross Earnings</span>
                                <span style={{ fontWeight: '700', color: '#1e293b' }}>{formatCurrency(payroll.base + (payroll.bonus || 0) + (payroll.houseRentAllowance || 0))}</span>
                            </div>
                        </div>
                        <div style={{ flex: '1', minWidth: '300px', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Deductions</span>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Amount</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>Income Tax</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.tax || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>Loss of Pay (LOP)</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.deductions || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                                <span style={{ color: '#1e293b' }}>Provident Fund</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(payroll.providentFund || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                                <span style={{ fontWeight: '700', color: '#1e293b' }}>Total Deductions</span>
                                <span style={{ fontWeight: '700', color: '#1e293b' }}>{formatCurrency((payroll.tax || 0) + (payroll.deductions || 0) + (payroll.providentFund || 0))}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>TOTAL NET PAYABLE</h4>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>Gross Earnings - Total Deductions</p>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(payroll.netPay)}</div>
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Amount In Words : </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Indian Rupee {numberToWords(payroll.netPay)}</span>
                    </div>

                    <div style={{ fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '8px', textAlign: 'center' }}>
                        -- This is a system-generated document. --
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaySlipModal;
