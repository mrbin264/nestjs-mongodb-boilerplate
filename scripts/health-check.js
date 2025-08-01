#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Health check script for Docker container
 * This script is used by Docker's HEALTHCHECK instruction
 */

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.APP_PORT || 3000,
  path: '/api/v1/health',
  timeout: 2000,
  method: 'GET'
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.error('Health check timed out');
  process.exit(1);
});

healthCheck.end();
