import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

async function testGeminiAPI() {
    try {
        // Better .env file handling
        const currentDir = process.cwd();
        console.log('Current directory:', currentDir);

        const envPath = path.resolve(currentDir, '../.env');
        console.log('Looking for .env file at:', envPath);

        // Check if .env file exists
        if (fs.existsSync(envPath)) {
            console.log('.env file found');
            // Load environment variables
            const result = dotenv.config({ path: envPath });

            if (result.error) {
                console.error('Error loading .env file:', result.error);
                return;
            }
            console.log('.env file loaded successfully');
        } else {
            console.error('.env file not found at the expected location');
            console.log('Creating a sample .env file for you...');

            // Create a sample .env file
            const sampleEnv = `# .env
OPEN_WEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
`;

            fs.writeFileSync(envPath, sampleEnv);
            console.log('Sample .env file created at:', envPath);
            console.log('Please edit this file to add your actual API keys and run the test again.');
            return;
        }

        // Get API key from environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in environment variables');
            console.log('Available environment variables:', Object.keys(process.env).filter(key =>
                !key.includes('PATH') && !key.includes('path')
            ));
            return;
        }

        console.log('API Key found:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));

        // Initialize the Google Generative AI
        const genAI = new GoogleGenerativeAI(apiKey);

        // Create a model instance with a specific model
        console.log('Creating model instance...');

        // Try different model names if one doesn't work
        const modelNames = [
            "gemini-pro",
            "gemini-1.5-pro",
            "gemini-1.0-pro"
        ];

        let result = null;
        let successfulModel = null;

        // Try each model until one works
        for (const modelName of modelNames) {
            try {
                console.log(`Trying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Generate content with a simple prompt
                const prompt = "Hello, how are you today?";
                result = await model.generateContent(prompt);

                // If we get here, the model worked
                successfulModel = modelName;
                console.log(`Success with model: ${modelName}`);
                break;
            } catch (modelError: unknown) {
                console.error(`Error with model ${modelName}:`,
                    modelError instanceof Error ? modelError.message : String(modelError));
                // Continue to the next model
            }
        }

        if (result && successfulModel) {
            // Output the response
            console.log(`\nSuccessful Model: ${successfulModel}`);
            console.log('Response:', result.response.text());

            // Output how to use this model in your main application
            console.log('\n-----------------------------------');
            console.log('To use this model in your application:');
            console.log(`const model = genAI.getGenerativeModel({ model: "${successfulModel}" });`);
        } else {
            console.error('\nAll models failed. Please check your API key and permissions.');
        }

    } catch (error: unknown) {
        console.error('Error:', error instanceof Error ? error.message : String(error));

        // More detailed error information
        if (error instanceof Error) {
            const errorMessage = error.message;

            if (errorMessage.includes('404')) {
                console.error('\nIt looks like the model name is incorrect or not available.');
            }

            if (errorMessage.includes('403')) {
                console.error('\nIt looks like there might be an issue with your API key or permissions.');
                console.error('Check that your API key is valid and has access to the Gemini API.');
            }
        }
    }
}

// Run the test
testGeminiAPI().catch((error: unknown) => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});