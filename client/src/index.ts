import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';


// Load environment variables
const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisify readline question
function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

async function runWeatherApp(city?: string) {
    // Initialize MCP Client
    const client = new Client(
        { name: 'WeatherClient', version: '1.0.0' },
        { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );

    // Create transport
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['../server/build/index.js']
    });

    try {
        // Connect to server
        await client.connect(transport);

        // Get weather tools
        const toolsResult = await client.listTools();
        console.log('Available tools:', toolsResult.tools);

        // If no city provided, ask user
        if (!city) {
            city = await askQuestion('Enter the city name for weather information: ');
        }

        // Validate city input
        if (!city) {
            console.log('No city entered. Exiting.');
            await client.close();
            rl.close();
            return;
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
        });

        // First, ask the LLM to verify and correct the city name if needed
        const verificationQuery = `Please verify if "${city}" is a valid city name. If it's misspelled, provide the correct spelling. Only respond with the corrected city name or confirm the original if it's correct.`;

        const verificationResult = await model.generateContent(verificationQuery);
        const verificationResponse = verificationResult.response.text();

        // Extract potential corrected city name
        // This regex looks for city names, potentially followed by country or state
        const cityRegex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b(?:,\s*(?:[A-Z][a-z]+(?:\s[A-Z][a-z]+)*))*/;
        const match = verificationResponse.match(cityRegex);

        let correctedCity = city;
        if (match && match[0] && match[0].toLowerCase() !== city.toLowerCase()) {
            correctedCity = match[0];
            const confirmCorrection = await askQuestion(`Did you mean "${correctedCity}"? (yes/no): `);

            if (confirmCorrection.toLowerCase() !== 'yes') {
                // User rejected the correction, use original input
                correctedCity = city;
            } else {
                console.log(`Using corrected city name: ${correctedCity}`);
            }
        }

        // Construct user query with potentially corrected city
        const userQuery = `What's the weather in ${correctedCity}?`;

        // Send to LLM
        const result = await model.generateContent(userQuery);
        const response = result.response;

        console.log('LLM Initial Response:', response.text());

        // Call the weather tool directly with the corrected city
        console.log(`Fetching weather for: ${correctedCity}`);

        // Call the weather tool
        const toolResult = await client.callTool({
            name: 'get_weather',
            arguments: { city: correctedCity }
        });

        if (toolResult && toolResult.content && Array.isArray(toolResult.content)) {
            console.log('Weather Result:', toolResult.content[0].text);
        } else {
            console.log('Tool returned unexpected result format:', toolResult);
        }

        // Close the connection
        await client.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Main execution function with support for multiple queries
async function main() {
    while (true) {
        try {
            await runWeatherApp();

            // Ask if user wants to continue
            const continueQuery = await askQuestion('Do you want to check weather for another city? (yes/no): ');

            if (continueQuery.toLowerCase() !== 'yes') {
                break;
            }
        } catch (error) {
            console.error('An error occurred:', error);
            break;
        }
    }

    // Close readline interface
    rl.close();
    console.log('Thank you for using the Weather App!');
}

// Start the application
main().catch(console.error);