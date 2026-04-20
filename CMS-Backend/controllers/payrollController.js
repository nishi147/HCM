const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');

// Create payroll entry
const createPayroll = async (req, res) => {
    try {
        const { userId, month, base, bonus: clientBonus, tax, deductions: clientDeductions, extraDays } = req.body;

        // Backend Calculation Logic for Unpaid Leave Deductions
        // 1. Parse Month & Year (expecting "Month YYYY")
        const [mName, yearStr] = month.split(' ');
        const year = parseInt(yearStr);
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = months.indexOf(mName);

        let finalDeductions = Number(clientDeductions);
        let finalBonus = Number(clientBonus) || 0;
        const daysInMonth = monthIndex !== -1 && !isNaN(year) ? new Date(year, monthIndex + 1, 0).getDate() : 30;

        // Calculate Bonus based on extraDays if provided
        if (extraDays && extraDays > 0) {
            const calculatedBonus = (Number(base) / daysInMonth) * Number(extraDays);
            finalBonus = Math.round(calculatedBonus);
        }

        if (monthIndex !== -1 && !isNaN(year)) {
            // 2. Fetch approved Unpaid Leaves for this user in this month
            const approvedLeaves = await Leave.find({
                userId,
                status: 'Approved',
                type: 'Unpaid Leave'
            });

            // 3. Fetch list of holidays for this month/year to adjust deductions
            const holidays = await Holiday.find({
                date: { $regex: `^${year}-${(monthIndex + 1).toString().padStart(2, '0')}` }
            });

            let unpaidValue = 0;
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
                            if (holiday.type === 'Half Day') {
                                unpaidValue += 0.5;
                            }
                            // Full Day Holiday = 0 deduction
                        } else {
                            // If no holiday, check if the leave itself is a Half Day
                            if (leave.dayType === 'Half Day') {
                                unpaidValue += 0.5;
                            } else {
                                unpaidValue += 1;
                            }
                        }
                    }
                }
            });

            // 4. Apply Deduction Formula: (Base / DaysInMonth) * unpaidValue
            // (Note: Removed the old "- 2" logic which was specific to an older requirement)
            if (unpaidValue > 0) {
                const autoDeduction = (Number(base) / daysInMonth) * unpaidValue;

                // We use the client provided deduction if it exists, otherwise auto-calculate
                if (!clientDeductions || clientDeductions === 0) {
                    finalDeductions = Math.round(autoDeduction);
                }
            }
        }

        const netPay = Number(base) + finalBonus - Number(tax) - finalDeductions;

        const payroll = new Payroll({
            userId,
            month,
            base: Number(base),
            bonus: finalBonus,
            extraDays: Number(extraDays) || 0,
            tax: Number(tax),
            deductions: finalDeductions,
            netPay,
            status: 'Pending'
        });

        await payroll.save();
        res.status(201).json(payroll);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all payrolls
const getAllPayroll = async (req, res) => {
    try {
        const payrolls = await Payroll.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update status
const updatePayrollStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) return res.status(404).json({ message: 'Payroll not found' });

        payroll.status = status;
        if (status === 'Paid') {
            payroll.paymentDate = new Date();
        }

        await payroll.save();
        res.json(payroll);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get employee's own payroll
const getMyPayroll = async (req, res) => {
    try {
        const payrolls = await Payroll.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(payrolls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPayroll,
    getAllPayroll,
    updatePayrollStatus,
    getMyPayroll
};
