# 🩺 Malaria Detection System

**Problem Solved:** Streamlines malaria diagnosis and patient management in hospitals through AI-powered detection, eliminating manual record-keeping and enabling faster, more accurate patient care.

A modern web application for hospital-based malaria detection and patient management. Built with React, Vite, Supabase, and TailwindCSS.

🔗 **Live Demo:** [https://malaria-detection-system.vercel.app/](https://malaria-detection-system.vercel.app/)

## ✨ Features

### Authentication

- Role-based access control (Doctor, Patient, Admin)
- Supabase JWT authentication for doctors and admins
- Patient login via medical record number and date of birth
- Secure session management

### Doctor Features

- Patient management and statistics
- Upload and manage test results
- Upload and share PDF reports with patients
- View analytics and trends
- Profile and settings management

### Patient Features

- View posted test results
- Access and download medical reports
- Track appointments
- Manage personal profile

### Admin Features

- User management (doctors, patients, admins)
- System analytics and monitoring
- Activity logs and alerts

### Technical Features

- Responsive design (mobile, tablet, desktop)
- Dark/light mode theme switching
- PDF report generation with jsPDF
- Supabase PostgreSQL database
- Secure file storage for images and PDFs
- Interactive data visualization with Recharts

## 🚀 Tech Stack

- **React 19.2.0** - UI framework
- **Vite 7.2.2** - Build tool
- **TailwindCSS 3.4.18** - CSS framework
- **React Router 7.9.6** - Routing
- **Recharts 3.4.1** - Data visualization
- **jsPDF 3.0.3** - PDF generation
- **Supabase** - Backend and database
- **PostgreSQL** - Database
- **Supabase Storage** - File storage

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # Authentication and theme contexts
├── pages/           # Page components
│   ├── admin/       # Admin pages
│   ├── doctor/      # Doctor pages (patients, reports, test results)
│   └── patient/     # Patient pages (my results, my reports)
├── services/        # API services and business logic
├── utils/           # Utility functions (PDF generation)
└── App.jsx          # Main application
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/Jayant-1/malaria-detection-system.git
cd malaria-detection-system-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Getting Supabase Credentials:**

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy the Project URL and anon/public key

### 4. Set Up Supabase Database

Create the following tables in Supabase SQL Editor:

- `patients` - Store patient information
- `test_results` - Store test results with posting status
- `reports` - Store PDF report metadata

Create storage buckets:

- `malaria-images` - For test images
- `reports` - For PDF reports

### 5. Start Development Server

```bash
npm run dev
```

### 6. Open in Browser

Navigate to `http://localhost:5173`

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎯 Usage

### Doctors

- Login with Supabase credentials
- Manage patients and view statistics
- Upload and post test results to patients
- Upload and share PDF reports
- View analytics and trends

### Patients

- Login with Medical Record Number + Date of Birth
- View posted test results
- Download medical reports
- Track appointments

### Admins

- Manage users (doctors, patients, admins)
- Monitor system activity and analytics
- Review system logs and alerts

## 🔒 Security

- JWT-based authentication via Supabase
- Row-level security (RLS) policies
- Role-based access control
- Secure file storage with access policies
- Environment variable protection

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

**Jayant Potdar**

- 📧 Email: [jayantpotdar2006@gmail.com](mailto:jayantpotdar2006@gmail.com)
- 📱 Phone: +91 878 864 0172
- 💼 LinkedIn: [Jayant Potdar](https://www.linkedin.com/in/jayant-potdar-880a461b8/)
- 🐙 GitHub: [Jayant-1](https://github.com/Jayant-1)
- 🐦 Twitter: [@Jayantpotdar\_](https://x.com/Jayantpotdar_)
- 📍 Location: Poona Hospital & Research Centre, Pune

**Project Links**

- 🌐 Live Demo: [https://malaria-detection-system.vercel.app/](https://malaria-detection-system.vercel.app/)
- 📦 Repository: [malaria-detection-system](https://github.com/Jayant-1/malaria-detection-system)
- 🐛 Issues: [Report Issues](https://github.com/Jayant-1/malaria-detection-system/issues)

---

**Malaria Detection System - Hospital Patient Management Platform**
