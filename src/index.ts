import app from './app.js';
import { ENV } from './config/env.js';

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log('===========================================================');
  console.log('🚀 PT DATA INTEGRASI INOVASI - BACKEND ACCESS SYSTEM');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📄 Swagger API Docs:  http://localhost:${PORT}/api-docs`);
  console.log(`🎨 Web UI Mockup:    http://localhost:${PORT}`);
  console.log('===========================================================');
});
