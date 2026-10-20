# MCIS deployment checklist

1. Use PHP 8.2+, MySQL 8+, HTTPS, and the values in `backend/.env.production.example`.
2. Run `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force`, `php artisan storage:link`, and `php artisan optimize`.
3. Build the frontend with `VITE_USE_MOCK=false`, `VITE_API_URL=https://your-host/api`, and `npm run build`.
4. Serve `dist/` through the web server and route `/api` to Laravel's `public/` directory.
5. Schedule `php artisan queue:work` under a process supervisor. Configure daily database backups with the hosting provider. Local SQLite installations can schedule `php artisan mcis:backup`.
6. Retain daily application logs and backups according to the university medical-data policy. Test restoration before launch.
7. Change all seeded passwords or disable seeded accounts before accepting real patient data.
