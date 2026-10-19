import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import regRoutes from './routes/registrations.js';

const app = express();
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, fest: "TAKSHAK'26" }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', regRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' }); });

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/takshak26')
  .then(() => app.listen(port, () => console.log(`TAKSHAK'26 API running on :${port}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
