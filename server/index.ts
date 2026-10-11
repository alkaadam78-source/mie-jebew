import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './db/database';
import { initMySQLSchema } from './db/mysql';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { menuRouter } from './routes/menu';
import { bottlesRouter } from './routes/bottles';
import { promotionsRouter } from './routes/promotions';
import { contentRouter } from './routes/content';
import { customOrderRouter } from './routes/customOrder';
import { mediaRouter } from './routes/media';
import { logsRouter } from './routes/logs';
import { ordersRouter } from './routes/orders';
import { rewardsRouter } from './routes/rewards';
import { customerAuthRouter } from './routes/customerAuth';
import { notificationsRouter } from './routes/notifications';
import { backupRouter } from './routes/backup';
import { healthMonitorRouter } from './routes/healthMonitor';
import { antiFraudRouter } from './routes/antiFraud';
import { reconciliationRouter } from './routes/reconciliation';
import { inventoryRouter } from './routes/inventory';
import { deploymentRouter } from './routes/deployment';
import { scheduledTasksRouter } from './routes/scheduledTasks';
import { featureFlagsRouter } from './routes/featureFlags';
import { reportsExportRouter } from './routes/reportsExport';
import { customersAdminRouter } from './routes/customersAdmin';
import { initScheduledBackup } from './services/backupService';
import { recordRequestMetric } from './services/healthMonitorService';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize database (SQLite fallback & MySQL / phpMyAdmin auto-connect)
initDatabase();
initMySQLSchema().catch((e) => console.warn('[MySQL Init Note]:', e.message));

// Initialize automated scheduled backup routine
initScheduledBackup();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health monitor request metric tracker
app.use((_req, res, next) => {
  res.on('finish', () => {
    recordRequestMetric(res.statusCode);
  });
  next();
});

// Ensure upload directory exists and serve as static assets
const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

import { systemRouter } from './routes/system';
import { maintenanceGuard } from './middleware/maintenance';

// Global Maintenance Guard (Server-Side Enforcement)
app.use(maintenanceGuard);

// API Routes
app.use('/api/system', systemRouter);
app.use('/api/system/backup', backupRouter);
app.use('/api/system/health', healthMonitorRouter);
app.use('/api/system/fraud', antiFraudRouter);
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/bottles', bottlesRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/content', contentRouter);
app.use('/api/custom-order', customOrderRouter);
app.use('/api/media', mediaRouter);
app.use('/api/logs', logsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/customer/auth', customerAuthRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin/reconciliation', reconciliationRouter);
app.use('/api/admin/inventory', inventoryRouter);
app.use('/api/admin/deployment', deploymentRouter);
app.use('/api/admin/tasks', scheduledTasksRouter);
app.use('/api/admin/features', featureFlagsRouter);
app.use('/api/features', featureFlagsRouter);
app.use('/api/admin/export', reportsExportRouter);
app.use('/api/admin/customers', customersAdminRouter);



// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Mie Jebew CMS API', timestamp: new Date().toISOString() });
});

// Production: serve built static files from dist
const DIST_PATH = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server Uncaught Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';
  res.status(status).json({ error: message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Mie Jebew CMS Server running on port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api`);
  console.log(`===============================================`);

  // Cloud Free Keep-Alive Routine (Anti-Sleep for Render / Koyeb)
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (externalUrl) {
    const healthUrl = `${externalUrl.replace(/\/$/, '')}/api/health`;
    console.log(`[Keep-Alive] Initialized self-ping every 14 minutes to: ${healthUrl}`);
    setInterval(async () => {
      try {
        const pingRes = await fetch(healthUrl, { signal: AbortSignal.timeout(10000) });
        if (pingRes.ok) {
          console.log(`[Keep-Alive] Ping OK (${new Date().toLocaleTimeString('id-ID')})`);
        }
      } catch (err: any) {
        console.warn(`[Keep-Alive] Ping notice: ${err.message}`);
      }
    }, 14 * 60 * 1000);
  }
});

export default app;
