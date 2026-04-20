# HR Cloud - Backend

This is the Express.js backend for the HR Cloud application. It handles authentication, employee management, attendance tracking, payroll processing, and leave requests.

## Prerequisites
- Node.js (v18+)
- MongoDB connection string (Atlas or Local)

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Configuration**
   Create a \`.env\` file in the \`Backend\` directory with the following variables:
   \`\`\`env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   \`\`\`

3. **Database Seeding (Optional but recommended for testing)**
   To quickly create an Admin and an Employee account:
   \`\`\`bash
   node seed.js
   \`\`\`
   This will create:
   - Admin: \`admin@demo.com\` / \`adminpassword\`
   - Employee: \`sarah@demo.com\` / \`password123\`

4. **Start the Server**
   For development (auto-restarts on changes):
   \`\`\`bash
   npm run dev
   \`\`\`
   
   For production:
   \`\`\`bash
   npm start
   \`\`\`

## Core Technologies
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Authentication
- Bcrypt.js for Password Hashing
