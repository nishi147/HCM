const SystemSetting = require('../models/SystemSetting');

const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await SystemSetting.findOne({ key });
        res.json(setting || { key, value: '' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        let setting = await SystemSetting.findOne({ key });
        
        if (setting) {
            setting.value = value;
            await setting.save();
        } else {
            setting = new SystemSetting({ key, value });
            await setting.save();
        }
        
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSetting,
    updateSetting
};
