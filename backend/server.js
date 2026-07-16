require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedData = require('./config/dataInitializer');
const { startScheduler } = require('./scheduler/escalationScheduler');

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB and Seed Data
connectDB().then(() => {
  seedData().then(() => {
    // Start Background Auto-Escalation Job
    startScheduler();
  });
});

// Debug endpoint matching Spring Boot DebugController
const { authenticateToken } = require('./middleware/auth');
app.get('/api/debug/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.send('Authentication is NULL');
  }
  return res.send(`User: ${req.user.email} | Authorities: [ROLE_${req.user.role.roleName}]`);
});

// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const staffRoutes = require('./routes/staff');
const hodRoutes = require('./routes/hod');
const principalRoutes = require('./routes/principal');
const publicRoutes = require('./routes/public');
const filesRoutes = require('./routes/files');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/grievances', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start Express Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
