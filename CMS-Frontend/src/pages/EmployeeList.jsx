import API_URL from '../utils/api';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, AlertCircle, User as UserIcon, Briefcase, Calendar, Tag, RefreshCw, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import PromptDialog from '../components/PromptDialog';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Custom Modal State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const [promptDialog, setPromptDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        placeholder: '',
        type: '',
        onConfirm: () => {}
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'employee',
        password: '',
        department: '',
        position: '',
        doj: '',
        dob: '',
        baseSalary: '',
        status: 'Active'
    });
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState(['Development', 'Marketing', 'QA', 'ALL']);
    const [positions, setPositions] = useState(['Developer', 'Executive', 'ALL']);

    const { token } = useAuth();
    


    useEffect(() => {
        fetchEmployees();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const [deptRes, posRes] = await Promise.all([
                axios.get(`${API_URL}/settings/departments`),
                axios.get(`${API_URL}/settings/positions`)
            ]);
            if (deptRes.data.value) setDepartments(JSON.parse(deptRes.data.value));
            if (posRes.data.value) setPositions(JSON.parse(posRes.data.value));
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleAddCategory = (type) => {
        setPromptDialog({
            isOpen: true,
            title: `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            message: `Please enter the name of the new ${type} you want to add to the directory.`,
            placeholder: `Enter ${type} name...`,
            type,
            onConfirm: async (name) => {
                const currentList = type === 'department' ? departments : positions;
                if (currentList.includes(name)) {
                    setError('This already exists!');
                    setPromptDialog(prev => ({ ...prev, isOpen: false }));
                    return;
                }

                const newList = [...currentList, name];
                try {
                    await axios.post(`${API_URL}/settings`, 
                        { key: type === 'department' ? 'departments' : 'positions', value: JSON.stringify(newList) },
                        { headers: { Authorization: `Bearer ${token}` }}
                    );
                    if (type === 'department') setDepartments(newList);
                    else setPositions(newList);
                    setPromptDialog(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error('Failed to add category:', err);
                    setError('Failed to add ' + type);
                    setPromptDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleDeleteCategory = (type) => {
        const currentValue = type === 'department' ? formData.department : formData.position;
        if (!currentValue) {
            setError('Please select an item to delete');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}?`,
            message: `Are you sure you want to remove "${currentValue}" from the list of ${type}s? This will not affect existing employees but they will no longer have this ${type} assigned properly if updated.`,
            onConfirm: async () => {
                const currentList = type === 'department' ? departments : positions;
                const newList = currentList.filter(item => item !== currentValue);
                
                try {
                    await axios.post(`${API_URL}/settings`, 
                        { key: type === 'department' ? 'departments' : 'positions', value: JSON.stringify(newList) },
                        { headers: { Authorization: `Bearer ${token}` }}
                    );
                    if (type === 'department') {
                        setDepartments(newList);
                        setFormData(prev => ({ ...prev, department: newList[0] || '' }));
                    } else {
                        setPositions(newList);
                        setFormData(prev => ({ ...prev, position: newList[0] || '' }));
                    }
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                } catch (err) {
                    console.error('Failed to delete category:', err);
                    setError('Failed to delete ' + type);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setLoading(false);
        }
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, password });
        setShowPassword(true);
    };

    const handleOpenModal = (employee = null) => {
        setShowPassword(false);
        if (employee) {
            setCurrentEmployee(employee);
            setFormData({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                password: '', // Leave empty unless admin wants to change it
                department: employee.department || '',
                position: employee.position || '',
                doj: employee.doj || '',
                dob: employee.dob || '',
                baseSalary: employee.baseSalary || '',
                status: employee.status || 'Active'
            });
        } else {
            setCurrentEmployee(null);
            setFormData({
                name: '',
                email: '',
                role: 'employee',
                password: 'password123',
                department: 'Development',
                position: 'Developer',
                doj: new Date().toISOString().split('T')[0],
                dob: '',
                baseSalary: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (currentEmployee) {
                await axios.put(`${API_URL}/employees/${currentEmployee._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/employees`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            fetchEmployees();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const handleDelete = (id) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Employee?',
            message: 'Are you sure you want to delete this employee? This action is permanent and all associated records (attendance, payroll, etc.) will be lost.',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_URL}/employees/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    fetchEmployees();
                } catch (err) {
                    console.error('Error deleting employee:', err);
                }
            }
        });
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Employee Directory</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', width: '100%', maxWidth: '360px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                        <Plus size={18} />
                        <span>Add Employee</span>
                    </button>
                </div>
            </div>

            <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                maxHeight: 'calc(100vh - 180px)'
            }}>
                <div style={{ overflowX: 'auto', flex: 1 }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salary</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)', fontSize: '12px' }}>
                                                {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{emp.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{emp.department || '--'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{emp.position || '--'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{emp.dob || '--'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{emp.doj || '--'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px', fontWeight: '600' }}>₹{emp.baseSalary?.toLocaleString() || '0'}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            background: emp.status === 'Active' ? '#f0fdf4' : '#fef2f2',
                                            color: emp.status === 'Active' ? '#16a34a' : '#dc2626',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            border: `1px solid ${emp.status === 'Active' ? '#dcfce7' : '#fee2e2'}`
                                        }}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => handleOpenModal(emp)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(emp._id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative' }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>{currentEmployee ? 'Update Employee' : 'Add New Employee'}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Enter the details for the employee profile.</p>

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        <UserIcon size={14} /> Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="Sarah Johnson"
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="sarah@demo.com"
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                            <Briefcase size={14} /> Department
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" title="Add Department" onClick={() => handleAddCategory('department')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'flex' }}><Plus size={14} /></button>
                                            <button type="button" title="Delete Selected" onClick={() => handleDeleteCategory('department')} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'flex' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                            <Tag size={14} /> Position
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" title="Add Position" onClick={() => handleAddCategory('position')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'flex' }}><Plus size={14} /></button>
                                            <button type="button" title="Delete Selected" onClick={() => handleDeleteCategory('position')} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, display: 'flex' }}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <select
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        required
                                    >
                                        <option value="">Select Position</option>
                                        {positions.map(pos => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        Base Salary (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.baseSalary}
                                        onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="50000"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        <Calendar size={14} /> Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        <Calendar size={14} /> Date of Joining
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.doj}
                                        onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-main)' }}>
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Password {currentEmployee && <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(leave empty to keep current)</span>}</label>
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <RefreshCw size={14} /> Generate
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required={!currentEmployee}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            style={{ width: '100%', padding: '12px', paddingRight: '44px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                            placeholder={currentEmployee ? "••••••••" : "Admin-set password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', gridColumn: 'span 2' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: '14px' }}>
                                        {currentEmployee ? 'Update Profile' : 'Create Employee'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PromptDialog 
                isOpen={promptDialog.isOpen}
                title={promptDialog.title}
                message={promptDialog.message}
                placeholder={promptDialog.placeholder}
                onConfirm={promptDialog.onConfirm}
                onCancel={() => setPromptDialog({ ...promptDialog, isOpen: false })}
            />

            <ConfirmDialog 
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
        </div>
    );
};

export default EmployeeList;

