const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (important for Railway)
app.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };

        // Check database if configured
        if (process.env.DATABASE_URL) {
            try {
                const { Pool } = require('pg');
                const pool = new Pool({ connectionString: process.env.DATABASE_URL });
                await pool.query('SELECT 1');
                health.database = 'connected';
                await pool.end();
            } catch (error) {
                health.database = 'disconnected';
                health.database_error = error.message;
            }
        }

        // Check service configurations
        health.services = {
            twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not_configured',
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
        };

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI Survey System',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            surveys: '/api/surveys',
            twilio: '/api/twilio'
        }
    });
});

// Basic API routes (will expand these)
app.get('/api/status', (req, res) => {
    res.json({
        api: 'AI Survey System',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// Twilio webhook endpoint (basic for now)
app.post('/api/twilio/voice', (req, res) => {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="alice">Hello! This is your AI Survey System. The system is working correctly. This call uses AI technology for survey purposes. Thank you for testing!</Say>
    </Response>`;
    
    res.type('text/xml');
    res.send(twiml);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AI Survey System running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
