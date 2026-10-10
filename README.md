# Zad Automation Supporter

Backend server for the Zad Automation support system built with Express.js and SQLite.

## Features

- User authentication (login, signup, password reset)
- Support request management (create, view, update, delete)
- Real-time dashboard updates via Server-Sent Events (SSE)
- Email notifications for new requests
- Role-based access control (admin, viewer, customer)
- Rate limiting

## Project Structure

```
.
├── public/                 # Static files (HTML, CSS, JS)
│   ├── admin.html
│   ├── login.html
│   ├── signup.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── zad_automation_website.html
│   └── ...
├── data/                   # Database files (gitignored)
│   └── zad_requests.db
├── src/
│   └── server/
│       ├── config/
│       │   ├── index.js       # Application configuration
│       │   └── database.js    # Database connection & schema
│       ├── middleware/
│       │   └── auth.js        # Authentication & authorization
│       ├── routes/
│       │   ├── auth.js        # Auth routes (login, signup, etc.)
│       │   ├── requests.js    # Request routes & SSE endpoint
│       │   └── stats.js       # Statistics route
│       └── services/
│           ├── email.js       # Email service
│           └── dashboard.js   # SSE event emitter
├── server.js                # Main entry point
├── package.json
├── .env.example
└── README.md
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Default Credentials

- **Admin**: `admin` / `admin123`
- **Viewer**: `viewer` / `viewer123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signup` - Customer registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Requests
- `POST /api/requests` - Submit a new request (public)
- `GET /api/requests/events` - SSE endpoint for real-time updates
- `GET /api/requests/my` - Get customer's own requests
- `GET /api/requests` - Get all requests (admin/viewer)
- `GET /api/requests/:id` - Get single request
- `PUT /api/requests/:id` - Update request status (admin)
- `DELETE /api/requests/:id` - Delete request (admin)

### Stats
- `GET /api/stats` - Get request statistics (admin/viewer)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| JWT_SECRET | zad_automation_secret_key | Secret key for JWT |
| EMAIL_HOST | smtp.ethereal.email | SMTP host |
| EMAIL_PORT | 587 | SMTP port |
| EMAIL_SECURE | false | TLS secure connection |
| EMAIL_USER | test@example.com | SMTP username |
| EMAIL_PASS | test-password | SMTP password |
| SENDER_EMAIL | no-reply@zad-automation.com | Default sender email |
| ADMIN_EMAIL | admin@zad-automation.com | Admin email for notifications |
| FRONTEND_URL | http://localhost:3000 | Frontend URL |

## License

MIT