import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';
import { Logger } from './logger.js';

// Configure logger
Logger.configure({
    consolePrint: false,  // Change to false to disable console output
    logPrefix: 'weather-client',
    maxFileSize: 5 * 1024 * 1024  // 5MB
});

// Log application start
Logger.info('Weather Application starting');

// Load environment variables
const envPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: envPath });
Logger.debug('Loaded environment variables', { path: envPath });

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

async function processUserQuery(userQuery: string, client: Client, openai: OpenAI) {
    try {
        Logger.info('Processing user query', { query: userQuery });
        console.log("Processing your query...");
        
        // 1. Use LLM to understand the query intent and extract parameters
        Logger.dataFlow('Sending query to LLM for intent analysis', { query: userQuery });
        const queryAnalysisPrompt = `
        Analyze the following user query to determine its intent and extract relevant information.
        
        User Query: "${userQuery}"
        
        If this is a weather-related query:
        1. Extract the city name
        2. Respond in JSON format: {"type": "weather", "city": "CITY_NAME"}
        
        If this is NOT a weather-related query:
        1. Respond in JSON format: {"type": "general", "query": "USER_QUERY"}
        
        Only respond with valid JSON. Do not include any explanation.
        `;
        
        const analysisResult = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a query intent analyzer. You extract information from user queries and format it as JSON." },
                { role: "user", content: queryAnalysisPrompt }
            ],
            max_tokens: 100
        });
        
        const analysisResponse = analysisResult.choices[0].message.content || '';
        Logger.llm('Received LLM analysis response', { response: analysisResponse });
        
        // Parse the JSON response
        let queryInfo;
        try {
            queryInfo = JSON.parse(analysisResponse);
            Logger.dataFlow('Parsed query intent', queryInfo);
        } catch (error) {
            Logger.error('Error parsing LLM response', { error, response: analysisResponse });
            console.log("Error parsing LLM response. Using generic processing.");
            queryInfo = { type: "general", query: userQuery };
        }
        
        // 2. Handle based on query type
        if (queryInfo.type === "weather" && queryInfo.city) {
            Logger.dataFlow('Query classified as weather query', { city: queryInfo.city });
            await handleWeatherQuery(queryInfo.city, client, openai);
        } else {
            Logger.dataFlow('Query classified as general query');
            await handleGeneralQuery(userQuery, openai);
        }
    } catch (error) {
        Logger.error('Error processing query', { error });
        console.error("Error processing query:", error);
    }
}

async function handleWeatherQuery(city: string, client: Client, openai: OpenAI) {
    Logger.info('Handling weather query', { city });
    
    // Skip verification for well-known cities or cities with more than one word
    // This avoids false corrections for names like "Bengaluru", "Mumbai", etc.
    const commonCities = ["bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad", "jaipur", "surat", "lucknow"];
    
    if (city.includes(" ") || commonCities.includes(city.toLowerCase())) {
        // Skip verification for multi-word cities or common Indian cities
        Logger.dataFlow('Skipping city name verification for known city', { city });
        await fetchAndDisplayWeather(city, client, openai);
        return;
    }
    
    // For other cities, verify with improved prompt
    Logger.dataFlow('Verifying city name with LLM', { city });
    const verificationResult = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a geography expert who verifies city names. For Indian cities like Bengaluru, Mumbai, etc., never suggest corrections unless there's a clear spelling error." },
            { role: "user", content: `Is "${city}" a valid city name? If it's clearly misspelled (like "Lndon" for "London"), provide the correct spelling. If it's a valid city name or a valid alternative spelling (like "Bengaluru" or "Bangalore"), just respond with the original name. Only respond with a city name.` }
        ],
        max_tokens: 50,
        temperature: 0.3 // Lower temperature for more predictable responses
    });

    const verificationResponse = verificationResult.choices[0].message.content?.trim() || '';
    Logger.llm('Received city verification response', { original: city, suggestion: verificationResponse });
    
    // Only suggest correction if it's substantially different
    if (verificationResponse.toLowerCase() !== city.toLowerCase() && 
        // Calculate Levenshtein distance or use simpler heuristic
        !city.toLowerCase().includes(verificationResponse.toLowerCase()) && 
        !verificationResponse.toLowerCase().includes(city.toLowerCase())) {
        
        Logger.dataFlow('Suggesting city correction to user', { original: city, suggestion: verificationResponse });
        const confirmCorrection = await askQuestion(`Did you mean "${verificationResponse}"? (yes/no): `);

        if (confirmCorrection.toLowerCase() === 'yes') {
            Logger.info('User accepted city correction', { original: city, corrected: verificationResponse });
            console.log(`Using corrected city name: ${verificationResponse}`);
            await fetchAndDisplayWeather(verificationResponse, client, openai);
        } else {
            Logger.info('User rejected city correction', { city });
            await fetchAndDisplayWeather(city, client, openai);
        }
    } else {
        // No correction needed
        Logger.dataFlow('No city correction needed', { city });
        await fetchAndDisplayWeather(city, client, openai);
    }
}

async function fetchAndDisplayWeather(city: string, client: Client, openai: OpenAI) {
    // Call the weather tool
    Logger.dataFlow('Calling MCP weather tool', { city });
    console.log(`Fetching weather for: ${city}`);
    
    try {
        const startTime = Date.now();
        const toolResult = await client.callTool({
            name: 'get_weather',
            arguments: { city }
        });
        Logger.client('MCP tool call completed', { 
            tool: 'get_weather', 
            durationMs: Date.now() - startTime
        });

        if (toolResult && toolResult.content && Array.isArray(toolResult.content)) {
            const weatherData = toolResult.content[0].text;
            Logger.dataFlow('Received weather data from MCP server', { city, data: weatherData });
            
            // Check if there was an error in the weather data
            if (weatherData.includes("Error") || weatherData.includes("error")) {
                Logger.weather('Weather API returned error', { city, error: weatherData });
                console.log(`\n${weatherData}`);
                
                // Provide a helpful response when weather data couldn't be found
                Logger.dataFlow('Generating friendly error response with LLM');
                const errorResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are a helpful weather assistant. The user's weather request couldn't be fulfilled." },
                        { role: "user", content: `I tried to get the weather for "${city}" but received this error: "${weatherData}". Please provide a helpful and friendly response.` }
                    ],
                    max_tokens: 150
                });
                
                const errorMessage = errorResponse.choices[0].message.content || "I couldn't retrieve the weather information for that location.";
                Logger.llm('Generated error response message', { message: errorMessage });
                console.log("\n" + errorMessage);
                return;
            }
            
            // Generate a natural language response with the weather data
            Logger.dataFlow('Formatting weather data with LLM');
            const finalResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful weather assistant. Format the weather information in a natural, conversational way." },
                    { role: "user", content: `Create a friendly response about the weather in ${city} with this data: ${weatherData}` }
                ],
                max_tokens: 150
            });
            
            const formattedResponse = finalResponse.choices[0].message.content || `Weather in ${city}: ${weatherData}`;
            Logger.llm('Generated formatted weather response', { response: formattedResponse });
            console.log("\n" + formattedResponse);
        } else {
            Logger.error('Unexpected result format from weather tool', { result: toolResult });
            console.log("\nError: Unexpected result format from weather tool");
        }
    } catch (error) {
        Logger.error('Error retrieving weather', { city, error });
        console.error("Error retrieving weather:", error);
    }
}

async function handleGeneralQuery(query: string, openai: OpenAI) {
    Logger.info('Handling general query', { query });
    
    // For general queries, just use the LLM directly
    Logger.dataFlow('Sending general query to LLM');
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful assistant. Provide informative and accurate responses to user queries." },
            { role: "user", content: query }
        ],
        max_tokens: 300
    });
    
    const responseText = response.choices[0].message.content || "I couldn't generate a response for that query.";
    Logger.llm('Received LLM response for general query', { response: responseText });
    console.log("\n" + responseText);
}

async function runAssistant() {
    Logger.info('Starting Weather Assistant');
    
    // Initialize MCP Client
    const client = new Client(
        { name: 'GenericAssistant', version: '1.0.0' },
        { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
    Logger.client('Initialized MCP client');

    // Create transport
    Logger.dataFlow('Creating MCP transport to connect to server');
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['../server/build/index.js']
    });

    // Initialize OpenAI
    Logger.llm('Initializing OpenAI client');
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        // Connect to server
        Logger.client('Connecting to MCP server');
        await client.connect(transport);
        Logger.client('Connected to MCP server successfully');

        // Get available tools
        const toolsResult = await client.listTools();
        Logger.client('Retrieved available MCP tools', { tools: toolsResult.tools.map(tool => tool.name) });
        console.log('Available MCP tools:', toolsResult.tools.map(tool => tool.name));
        
        console.log("\nGeneric AI Assistant (with Weather capabilities)");
        console.log("Type 'exit' to quit the program\n");

        while (true) {
            const userQuery = await askQuestion("\nHow can I help you? ");
            
            if (userQuery.toLowerCase() === 'exit') {
                Logger.info('User requested exit');
                break;
            }
            
            if (userQuery.trim()) {
                await processUserQuery(userQuery, client, openai);
            }
        }

        // Close the connection
        Logger.client('Closing MCP server connection');
        await client.close();
    } catch (error) {
        Logger.error('Error in assistant', { error });
        console.error('Error:', error);
    } finally {
        rl.close();
        Logger.info('Weather Assistant terminated');
        console.log("Thank you for using the assistant. Goodbye!");
    }
}

// Start the application
runAssistant().catch(error => {
    Logger.error('Unhandled error in main application', { error });
    console.error(error);
});