#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });

const server = new McpServer({
  name: 'WeatherServer',
  version: '1.0.0'
});

// Weather Tool
server.tool(
  'get_weather',
  { city: z.string() },
  async ({ city }) => {
    try {
      const apiKey = process.env.OPEN_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric'
        }
      });

      const weatherData = response.data;
      const description = `Temperature: ${weatherData.main.temp}°C, 
                           Conditions: ${weatherData.weather[0].description}, 
                           Humidity: ${weatherData.main.humidity}%`;

      return {
        content: [{
          type: 'text',
          text: description
        }]
      };
    } catch (error: any) {
      console.error('Weather API Error:', error.message);
      return {
        content: [{
          type: 'text',
          text: `Error fetching weather: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);