const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    modules: [{
        type: String
    }],
    phases: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Active', 'Completed', 'On Hold'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
