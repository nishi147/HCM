# HR Cloud - Frontend

This is the React.js frontend for the HR Cloud application. It provides a premium, responsive dashboard for both Administrators and Employees.

## Prerequisites
- Node.js (v18+)
- Backend server running locally or deployed.

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Configuration**
   Create a \`.env\` file in the \`Frontend\` directory to point to your backend API:
   \`\`\`env
   VITE_API_URL=http://localhost:5000/api
   \`\`\`

3. **Start the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   The application will usually start on \`http://localhost:5173\`.

4. **Build for Production**
   \`\`\`bash
   npm run build
   \`\`\`
   The optimized production build will be output to the \`dist/\` folder.

## Core Technologies
- React.js with Vite
- React Router DOM for Navigation
- Framer Motion for Animations
- Lucide React for Icons
- Axios for API requests
- Context API for State Management (Auth)
- Pure CSS with variables for styling

## Features
- **Admin Dashboard**: Manage employees, approve/reject leaves, process payroll, and view overall attendance stats.
- **Employee Dashboard**: View active timesheets, request leaves, view personal payroll slips, and track total worked hours.
- Responsive, premium design aesthetic.
