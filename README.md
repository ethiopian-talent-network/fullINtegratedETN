# ETN - Ethiopian Talent Network

A professional freelance marketplace connecting Ethiopian talent with global opportunities.

---

## Overview

ETN is a comprehensive platform that enables Ethiopian professionals to showcase their skills and connect with employers worldwide. Built with modern web technologies, it provides a seamless experience for both talent seekers and employers.

## Key Features

**For Talent**

- Job discovery and applications
- Portfolio showcase
- Professional networking
- Secure messaging
- Earnings dashboard

**For Employers**

- Job posting management
- Talent discovery
- Application tracking
- Contract management
- Secure payments

**Platform**

- JWT authentication
- Real-time notifications
- Responsive design
- AI-powered matching
- Payment integration

## Tech Stack

**Backend**

- Node.js + Express
- MySQL + Redis
- JWT authentication
- Cloudinary storage
- Chapa payments

**Frontend**

- React 18 + TypeScript
- Vite + Tailwind CSS
- React Router v7
- Lucide icons

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd ETN

# Backend
cd Backend && npm install
cp .env.example .env && npm start

# Frontend
cd ../Frontend && npm install
cp .env.example .env && npm run dev
```

Access at:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Database Setup

```sql
CREATE DATABASE etn_db;
```

```bash
cd Backend
mysql -u root -p etn_db < database/contracts_schema.sql
mysql -u root -p etn_db < database/messages_schema.sql
```

## Environment Variables

**Backend (.env)**

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE=etn_db
JWT_SECRET=your_jwt_secret
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (.env)**

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Project Structure

```
ETN/
├── Backend/          # Node.js API
│   ├── Controllers/
│   ├── Routes/
│   ├── Middlewares/
│   └── Database/
└── Frontend/         # React app
    ├── Components/
    ├── Features/
    ├── Pages/
    └── API/
```

## Security

- JWT authentication with bcrypt
- Rate limiting and CORS protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Role-based access control

## Deployment

**Backend**

```bash
npm install -g pm2
pm2 start server.js --name etn-backend
```

**Frontend**

```bash
npm run build
# Deploy to Vercel, Netlify, or AWS S3
```

## Documentation

- [API Reference](Backend/API/endPoints.js)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Contract System](Backend/CONTRACT_SYSTEM.md)

---

**Version:** 1.0.0 | **Status:** Production Ready
**License:** Proprietary | **Support:** support@etn.com

Made with ❤️ by the ETN Team
