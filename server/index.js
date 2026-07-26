import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './auth.routes.js';
import forecastsRoutes from './forecasts.routes.js';
import usersRoutes from './users.routes.js';
import { handleError, notFound } from './errors.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: join(currentDirectory, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/forecasts', forecastsRoutes);
app.use('/api/users', usersRoutes);
// Temporary compatibility path for clients from the pre-Forekast prototype.
app.use('/api/tweets', forecastsRoutes);

app.get('/', (req, res) => {
  res.send('Forekast backend server is running smoothly!');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use(notFound);
app.use(handleError);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
