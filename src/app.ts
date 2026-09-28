import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend UI mockup (Poin Soal #6: Nilai Lebih)
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// Interactive Swagger UI documentation (Poin Soal #3)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'API Docs - PT Data Integrasi Inovasi',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Backend PT Data Integrasi Inovasi (NUHA)'
  });
});

// Fallback to Web UI Mockup for root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
