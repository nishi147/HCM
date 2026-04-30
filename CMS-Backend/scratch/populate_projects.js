const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Project = require('../models/Project');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const projectsData = [
        { name: '010_Cenovus_Phase_II', modulesCount: 10 },
        { name: '010_Cenovus - Phase - II - Set - II', modulesCount: 4 },
        { name: 'Cenovus Phase II', modulesCount: 4 },
        { name: 'Cenovus_Phase_I', modulesCount: 1 },
        { name: 'marketing', modulesCount: 1 },
        { name: 'Cenovus_Phase II', modulesCount: 8 },
        { name: 'Cenovus Phase II ', modulesCount: 2 }, // Added space to distinguish if needed
        { name: 'Cenovus Phase 2- Electrical_Work_Practice', modulesCount: 1 },
        { name: 'Cenivus_Phase II', modulesCount: 1 },
        { name: 'Cenovus_Phase_II', modulesCount: 1 },
        { name: 'Cenovus Phase 2- SeaRose System Overview', modulesCount: 2 },
        { name: 'Cenovus II', modulesCount: 1 },
        { name: 'Cenovus_II', modulesCount: 1 },
        { name: '010_Cenovus - Phase - II - Set - I', modulesCount: 1 },
        { name: 'Cenovus Phase 2- HAS07 Electrical Safety', modulesCount: 1 },
        { name: 'Cenovus Phase 2 Enterprise Risk Management', modulesCount: 1 },
        { name: 'Proofpoint_OWASP_M6_A5_Injection', modulesCount: 1 },
        { name: 'Proofpoint_OWASP', modulesCount: 3 },
        { name: 'Proofpoint_OWASP_M8_A7-Authentication Failures', modulesCount: 1 },
        { name: '010_Cenovus - Phase - II', modulesCount: 1 },
        { name: 'Cenovus phase 2', modulesCount: 1 },
        { name: 'Cenovus Phase 2', modulesCount: 1 },
        { name: '010_Cenovus Phase II', modulesCount: 1 },
        { name: 'cenovus phase 1', modulesCount: 1 },
        { name: 'Proofpoint_OWASP_M4_Software Supply Chain Failures', modulesCount: 1 }
    ];

    for (const p of projectsData) {
        const modules = Array.from({ length: p.modulesCount }, (_, i) => `Module ${i + 1}`);
        
        // Use upsert to avoid duplicates if some exist
        await Project.findOneAndUpdate(
            { name: p.name },
            {
                name: p.name,
                modules: modules,
                phases: ['alpha', 'beta', 'gold', 'scorm'],
                status: 'Active',
                description: `Project ${p.name}`
            },
            { upsert: true, new: true }
        );
        console.log(`Created/Updated project: ${p.name}`);
    }

    process.exit(0);
}

run();
