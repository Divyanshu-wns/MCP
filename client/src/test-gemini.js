"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var generative_ai_1 = require("@google/generative-ai");
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
function testGeminiAPI() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDir, envPath, result_1, sampleEnv, apiKey, genAI, modelNames, result, successfulModel, _i, modelNames_1, modelName, model, prompt_1, modelError_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    currentDir = process.cwd();
                    console.log('Current directory:', currentDir);
                    envPath = path.resolve(currentDir, '../.env');
                    console.log('Looking for .env file at:', envPath);
                    // Check if .env file exists
                    if (fs.existsSync(envPath)) {
                        console.log('.env file found');
                        result_1 = dotenv.config({ path: envPath });
                        if (result_1.error) {
                            console.error('Error loading .env file:', result_1.error);
                            return [2 /*return*/];
                        }
                        console.log('.env file loaded successfully');
                    }
                    else {
                        console.error('.env file not found at the expected location');
                        console.log('Creating a sample .env file for you...');
                        sampleEnv = "# .env\nOPEN_WEATHER_API_KEY=your_openweather_api_key\nGEMINI_API_KEY=your_gemini_api_key\n";
                        fs.writeFileSync(envPath, sampleEnv);
                        console.log('Sample .env file created at:', envPath);
                        console.log('Please edit this file to add your actual API keys and run the test again.');
                        return [2 /*return*/];
                    }
                    apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        console.error('GEMINI_API_KEY not found in environment variables');
                        console.log('Available environment variables:', Object.keys(process.env).filter(function (key) {
                            return !key.includes('PATH') && !key.includes('path');
                        }));
                        return [2 /*return*/];
                    }
                    console.log('API Key found:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
                    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                    // Create a model instance with a specific model
                    console.log('Creating model instance...');
                    modelNames = [
                        "gemini-pro",
                        "gemini-1.5-pro",
                        "gemini-1.0-pro"
                    ];
                    result = null;
                    successfulModel = null;
                    _i = 0, modelNames_1 = modelNames;
                    _a.label = 1;
                case 1:
                    if (!(_i < modelNames_1.length)) return [3 /*break*/, 6];
                    modelName = modelNames_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    console.log("Trying model: ".concat(modelName, "..."));
                    model = genAI.getGenerativeModel({ model: modelName });
                    prompt_1 = "Hello, how are you today?";
                    return [4 /*yield*/, model.generateContent(prompt_1)];
                case 3:
                    result = _a.sent();
                    // If we get here, the model worked
                    successfulModel = modelName;
                    console.log("Success with model: ".concat(modelName));
                    return [3 /*break*/, 6];
                case 4:
                    modelError_1 = _a.sent();
                    console.error("Error with model ".concat(modelName, ":"), modelError_1.message);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (result && successfulModel) {
                        // Output the response
                        console.log("\nSuccessful Model: ".concat(successfulModel));
                        console.log('Response:', result.response.text());
                        // Output how to use this model in your main application
                        console.log('\n-----------------------------------');
                        console.log('To use this model in your application:');
                        console.log("const model = genAI.getGenerativeModel({ model: \"".concat(successfulModel, "\" });"));
                    }
                    else {
                        console.error('\nAll models failed. Please check your API key and permissions.');
                    }
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error('Error:', error_1);
                    // More detailed error information
                    if (error_1.message && error_1.message.includes('404')) {
                        console.error('\nIt looks like the model name is incorrect or not available.');
                    }
                    if (error_1.message && error_1.message.includes('403')) {
                        console.error('\nIt looks like there might be an issue with your API key or permissions.');
                        console.error('Check that your API key is valid and has access to the Gemini API.');
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testGeminiAPI().catch(function (error) {
    console.error('Unhandled error:', error);
});
