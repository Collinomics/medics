# Kyambogo University Medical Center Information System

MCIS is a responsive, role-based healthcare workflow platform for Kyambogo University Medical Center. It connects patient registration, reception and triage, clinical consultation, laboratory work, pharmacy dispensing, injections, dental referrals, medical cards, reporting, notifications, and system administration in one application.

## Features

- Student, staff, dependent, and patient registration with administrator approval
- Digital medical cards with faculty-specific colours, photographs, expiry calculation, and print support
- Reception queue management, triage, patient search, and visit history
- Doctor consultation workflow with diagnoses, prescriptions, laboratory orders, injections, and referrals
- Dedicated laboratory, pharmacy, injection-room, dental, and records dashboards
- Partial pharmacy dispensing with stock tracking
- Personal profiles, password changes, profile photographs, and notifications
- Administrator-managed staff accounts, card appearance, registration, queue, pharmacy, security, and announcement settings
- PDF clinical activity reports, audit logging, backups, and role-based access control
- Responsive layouts for desktop, tablet, and mobile devices

## Technology

### Frontend

- React 18 and Vite
- React Router
- Zustand
- Axios
- Tailwind CSS
- Recharts and Lucide React

### Backend

- Laravel 12 and PHP 8.2+
- SQLite by default, with Laravel-supported database alternatives
- Token-based API authentication
- PHPUnit feature tests

## Project structure

```text
src/                 React application
backend/             Laravel API
database/            Reference SQL schemas
docs/                Workflow, API, phase, and deployment documentation
public/               Public frontend assets
```

## Local installation

### Requirements

- Node.js 18+
- PHP 8.2+
- Composer 2
- PHP SQLite, Mbstring, XML, cURL, and ZIP extensions

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

On Windows PowerShell, create the database with:

```powershell
New-Item database/database.sqlite -ItemType File -Force
```

### Frontend

From the repository root:

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend defaults to `http://localhost:8000/api`. Configure `VITE_API_URL` when the API uses another address. Set `VITE_USE_MOCK=true` only when intentionally running with demonstration data.

## Testing

```bash
cd backend
php artisan test
```

```bash
npm run build
```

## Production deployment

Build the frontend with production API values, serve `dist/` with a web server, and route `/api` to `backend/public/index.php`. Run migrations, create the Laravel storage link, cache configuration, and supervise the queue worker and scheduler. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the deployment checklist.

## Security and data handling

Environment files, API keys, private keys, SQLite databases, uploaded medical images, logs, backups, dependency directories, and generated builds are excluded from version control. Never commit real patient information or production credentials. The seeded accounts are intended only for local development and their default passwords must be changed before handling real data.

## License

This project is private software developed for Kyambogo University Medical Center. No public license is granted.
