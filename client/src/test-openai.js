"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var openai_1 = require("openai");
var dotenv = require("dotenv");
var path = require("path");
var fs = require("fs");
function testOpenAIAPI() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDir, envPath, result, allEnvVars, apiKey, maskedKey, openai, response, error_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    currentDir = process.cwd();
                    console.log('Current directory:', currentDir);
                    envPath = path.resolve(currentDir, '../.env');
                    console.log('Looking for .env file at:', envPath);
                    // Check if .env file exists
                    if (fs.existsSync(envPath)) {
                        console.log('.env file found');
                        result = dotenv.config({ path: envPath });
                        if (result.error) {
                            console.error('Error loading .env file:', result.error);
                            return [2 /*return*/];
                        }
                        console.log('.env file loaded successfully');
                        // Debug: Print all loaded environment variables
                        console.log('All loaded env variables:');
                        allEnvVars = Object.keys(process.env).filter(function (key) {
                            return key.includes('OPENAI') || key.includes('GEMINI') || key.includes('WEATHER');
                        });
                        console.log(allEnvVars);
                    }
                    else {
                        console.error('.env file not found at the expected location');
                        return [2 /*return*/];
                    }
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        console.error('OPENAI_API_KEY not found in environment variables');
                        return [2 /*return*/];
                    }
                    // Check if the key is a placeholder
                    if (apiKey.includes('your') || apiKey.includes('demo')) {
                        console.error('Error: Your OpenAI API key appears to be a placeholder.');
                        console.error('Please replace it with your actual API key in the .env file.');
                        return [2 /*return*/];
                    }
                    maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
                    console.log('API Key found:', maskedKey);
                    openai = new openai_1.default({
                        apiKey: apiKey
                    });
                    console.log('Testing OpenAI API connection...');
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: "gpt-3.5-turbo",
                            messages: [
                                { role: "system", content: "You are a helpful assistant." },
                                { role: "user", content: "Hello, are you working?" }
                            ],
                            max_tokens: 50
                        })];
                case 1:
                    response = _a.sent();
                    console.log('\nAPI connection successful!');
                    console.log('Response:', response.choices[0].message.content);
                    console.log('\nYour OpenAI API key is working correctly.');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error testing OpenAI API:', error_1 instanceof Error ? error_1.message : String(error_1));
                    // More detailed error handling
                    if (error_1 instanceof Error) {
                        errorMessage = error_1.message;
                        if (errorMessage.includes('401')) {
                            console.error('\nAuthentication error: Your API key may be invalid or expired.');
                            console.error('Please check your API key format - it should start with "sk-" and not contain any spaces or quotes.');
                        }
                        else if (errorMessage.includes('429')) {
                            console.error('\nRate limit exceeded: You have exceeded your current quota.');
                        }
                        else if (errorMessage.includes('500')) {
                            console.error('\nOpenAI server error: Try again later.');
                        }
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testOpenAIAPI().catch(function (error) {
    console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
