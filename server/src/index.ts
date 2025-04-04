#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Create a logs directory in the server folder
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a logger function for the server
const logFile = path.resolve(logsDir, `weather-server-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Properly typed log function
function log(level: string, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}]: ${message}`;
  
  if (data) {
    const dataString = typeof data === 'string' 
      ? data 
      : JSON.stringify(data, null, 2);
    logMessage += `\n  └─ Details: ${dataString}`;
  }
  
  logStream.write(logMessage + '\n');
}

// Log server startup
log('INFO', 'Weather Server starting');

// Load environment variables
const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });
log('DEBUG', 'Loaded environment variables', { path: envPath });

const server = new McpServer({
  name: 'WeatherServer',
  version: '1.0.0'
});

log('INFO', 'MCP Server initialized');

// Weather Tool
server.tool(
  'get_weather',
  { city: z.string() },
  async ({ city }) => {
    log('INFO', 'Received weather request', { city });
    try {
      const apiKey = process.env.OPEN_WEATHER_API_KEY;
      if (!apiKey) {
        log('ERROR', 'OpenWeatherMap API key not configured');
        throw new Error('OpenWeatherMap API key not configured');
      }

      log('DATA_FLOW', 'Sending request to OpenWeatherMap API', { city });
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric'
        }
      });

      const weatherData = response.data;
      log('DATA_FLOW', 'Received weather data from API', { 
        city, 
        temp: weatherData.main.temp,
        conditions: weatherData.weather[0].description,
        humidity: weatherData.main.humidity
      });
      
      const description = `Temperature: ${weatherData.main.temp}°C, 
                           Conditions: ${weatherData.weather[0].description}, 
                           Humidity: ${weatherData.main.humidity}%`;

      log('INFO', 'Returning weather data to client', { city });
      return {
        content: [{
          type: 'text',
          text: description
        }]
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      log('ERROR', 'Weather API Error', { city, error: errorMessage });
      
      return {
        content: [{
          type: 'text',
          text: `Error fetching weather: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

log('INFO', 'Weather tool registered');

// Set up server transport
const transport = new StdioServerTransport();
log('INFO', 'Server transport initialized');

// Connect the server and start listening
log('INFO', 'Starting MCP server');
server.connect(transport).catch((error: any) => {
  log('ERROR', 'Error connecting server', { error: error.message });
  console.error(error);
});

// Handle process termination
process.on('exit', () => {
  log('INFO', 'Server shutting down');
  logStream.end();
});

// Handle unexpected errors
process.on('uncaughtException', (error: Error) => {
  log('ERROR', 'Uncaught exception', { error: error.message, stack: error.stack });
  logStream.end();
  process.exit(1);
});