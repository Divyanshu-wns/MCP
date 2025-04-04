import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

async function testOpenAIAPI() {
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
            
            // Debug: Print all loaded environment variables
            console.log('All loaded env variables:');
            const allEnvVars = Object.keys(process.env).filter(key => 
                key.includes('OPENAI') || key.includes('GEMINI') || key.includes('WEATHER')
            );
            console.log(allEnvVars);
        } else {
            console.error('.env file not found at the expected location');
            return;
        }

        // Get API key directly from environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OPENAI_API_KEY not found in environment variables');
            return;
        }

        // Check if the key is a placeholder
        if (apiKey.includes('your') || apiKey.includes('demo')) {
            console.error('Error: Your OpenAI API key appears to be a placeholder.');
            console.error('Please replace it with your actual API key in the .env file.');
            return;
        }

        // Display key safely
        const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
        console.log('API Key found:', maskedKey);

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: apiKey
        });

        console.log('Testing OpenAI API connection...');

        // Make a simple request to test the API key
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Hello, are you working?" }
            ],
            max_tokens: 50
        });

        console.log('\nAPI connection successful!');
        console.log('Response:', response.choices[0].message.content);
        console.log('\nYour OpenAI API key is working correctly.');

    } catch (error: unknown) {
        console.error('Error testing OpenAI API:', error instanceof Error ? error.message : String(error));
        
        // More detailed error handling
        if (error instanceof Error) {
            const errorMessage = error.message;
            
            if (errorMessage.includes('401')) {
                console.error('\nAuthentication error: Your API key may be invalid or expired.');
                console.error('Please check your API key format - it should start with "sk-" and not contain any spaces or quotes.');
            } else if (errorMessage.includes('429')) {
                console.error('\nRate limit exceeded: You have exceeded your current quota.');
            } else if (errorMessage.includes('500')) {
                console.error('\nOpenAI server error: Try again later.');
            }
        }
    }
}

// Run the test
testOpenAIAPI().catch((error: unknown) => {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
