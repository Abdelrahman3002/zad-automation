# Zad Automation Support System - Project Progress

## Project Overview
A bilingual (Arabic/English) support request system with customer-facing website and admin dashboard, deployed on Railway.

---

## 📁 File Structure
```
D:\Desktop\Website\
├── zad_automation_website.html   # Customer landing page + request forms
├── admin.html                    # Admin dashboard (requests management)
├── server.js                     # Express + SQLite API server
├── js/app.js                     # Frontend logic (forms, i18n, API)
├── css/style.css                 # Custom styles + Tailwind utilities
├── package.json                  # Dependencies
├── data/zad_requests.db          # SQLite database (auto-created)
└── .gitignore
```

---

## ✅ Completed Features

### 1. Customer Website (`zad_automation_website.html`)
- **Hero section** with animated stats & CTAs
- **Services grid** with tab filtering (Electronics, 3D Molds, Contracts)
- **3D Mold Calculator** with dimension/material inputs
- **Two request modals**:
  - Maintenance Request (company, phone, fault type)
  - 3D Mold Request (company, notes/specs)
- **Bilingual**: Arabic (RTL) / English (LTR) with `data-i18n` attributes
- **Form validation** + `name` attributes for FormData API

### 2. Admin Dashboard (`admin.html`)
- **Stats cards**: Total, New, In Progress, Completed, Closed
- **Requests table** with columns: ID, Service, Company, Phone, Date, Status, Actions
- **Filters**: Status dropdown + search input
- **Detail modal**: View full request, change status, delete
- **Auto-refresh** every 30 seconds
- **Bilingual** (same i18n system)
- **Direct call links** (tel:)

### 3. Backend API (`server.js`)
```javascript
// Endpoints
POST   /api/requests        // Create request
GET    /api/requests        // List (query: ?status=&search=)
GET    /api/requests/:id    // Single request
PUT    /api/requests/:id    // Update status
DELETE /api/requests/:id    // Delete request
GET    /api/stats           // Counts by status

// Database: SQLite (data/zad_requests.db)
// Table: requests (id, service, company, phone, type, notes, specs, submittedAt, status, updatedAt)
```

### 4. Frontend Logic (`js/app.js`)
- **i18n system**: `translations` object + `toggleLanguage()`
- **Form handling**: `handleFormSubmit()` → POST /api/requests
- **Modal management**: `openModal()` / `closeModal()`
- **3D Calculator**: Volume/lead-time estimation
- **Scroll animations**: IntersectionObserver reveal

### 5. Deployment
- **Platform**: Railway (free tier)
- **URL**: `https://zad-automation-production.up.railway.app`
- **Auto-deploy**: GitHub push → Railway rebuild
- **Database**: Persists across deploys (Railway volume)

---

## 🔧 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, Tailwind CSS (CDN), FontAwesome |
| Backend | Node.js, Express, SQLite3, CORS |
| Database | SQLite (file-based, no separate server) |
| Hosting | Railway (auto HTTPS, custom subdomain) |
| Language | Arabic (RTL) / English (LTR) |

---

## 📦 Dependencies (`package.json`)
```json
{
  "name": "zad-automation-supporter",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "sqlite3": "^5.1.7"
  }
}
```

---

## 🌐 Live URLs
| Page | URL |
|------|-----|
| Customer Site | `https://zad-automation-production.up.railway.app/zad_automation_website.html` |
| Admin Dashboard | `https://zad-automation-production.up.railway.app/admin.html` |
| API Base | `https://zad-automation-production.up.railway.app/api/` |

---

## 🐛 Known Issues (Non-Blocking)
1. **Tailwind CDN warning** - "cdn.tailwindcss.com should not be used in production"
2. **Kaspersky SDK errors** - External security service, CORS blocked (doesn't affect functionality)
3. **No authentication** - Admin dashboard is public (next priority)

---

## 📋 Next Steps / TODO
1. **Add authentication** (login page, JWT/session, role-based access)
2. **Separate customer portal** (customers see only their requests)
3. **Email/SMS notifications** on new requests
4. **PostgreSQL migration** (for multi-user production)
5. **Tailwind CLI build** (remove CDN dependency)
6. **Unit/integration tests**
7. **CI/CD pipeline** (GitHub Actions)
8. **Backup strategy** for SQLite

---

## 🚀 Deployment Workflow
```bash
# Local development
cd D:\Desktop\Website
node server.js           # http://localhost:3000

# Deploy changes
git add .
git commit -m "message"
git push origin main     # Triggers Railway auto-deploy

# Check Railway logs
# Dashboard → Project → Deployments → View logs
```

---

## 🔑 Key Implementation Details

### FormData Fix (Critical)
Forms **must** have `name` attributes for `FormData()` to work:
```html
<input name="company" required ...>
<input name="phone" required ...>
<select name="type">...</select>
<textarea name="notes">...</textarea>
```

### API Request Format
```json
{
  "service": "صيانة",
  "company": "Test Company",
  "phone": "+201000000000",
  "type": "عطل خط إنتاج كامل",
  "notes": "Additional details",
  "specs": "",
  "submittedAt": "2026-10-09T03:48:15.964Z",
  "status": "new"
}
```

### Status Values
`new` → `confirmed` → `progress` → `done` → `closed`

---

## 🗂️ Git History
- **Initial commit**: Customer site + admin + API
- **Form fix**: Added `name` attributes to all form inputs
- **Railway deploy**: Live at production URL

---

## 💡 For Next Chat Session
**To continue work**, provide this context:
1. "Project is deployed on Railway at [URL]"
2. "Current stack: Express + SQLite + Vanilla JS"
3. "Customer site + admin dashboard working"
4. "Need to add: [specific feature]"
5. Reference this file for full history

---

## 📅 Last Updated
**2026-10-09** - System fully functional, deployed, no auth yet.