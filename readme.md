# Weather Application

## Overview

This application is a command-line weather service that leverages the Model Context Protocol (MCP) framework to create a sophisticated architecture with client-server interaction enhanced by AI capabilities. The app allows users to query weather information for cities, with LLM-powered spelling correction and natural language processing.

## Architecture

The system consists of three main components:

1. **Client Application** (`client/src/index.ts`)
   - Handles user input and displays results
   - Manages communication with both server and LLM
   - Orchestrates the workflow

2. **Server Application** (`server/src/index.ts`)
   - Provides specialized tools as a backend service
   - Connects to external APIs (OpenWeatherMap)
   - Exposes capabilities through a standardized interface

3. **Language Model** (Google's Gemini)
   - Processes natural language
   - Interprets user queries and corrects spelling mistakes
   - Provides natural language responses

## Flow of Interactions

### 1. Client Initialization
```
[CLIENT]: Initializing MCP Client
[CLIENT]: Creating transport connection to server
```

### 2. Server Connection
```
[CLIENT]: Connecting to server
[CLIENT]: Connected to server successfully
```

### 3. Tool Discovery
```
[CLIENT]: Fetching available tools
[CLIENT]: Available tools
└─ Details: [{"name": "get_weather", "inputSchema": {...}}]
```

### 4. User Input Processing
```
[INFO]: User entered city: allabhad
```

### 5. LLM for City Validation
```
[LLM]: Initializing Gemini AI
[LLM]: Sending verification query to LLM
└─ Details: Please verify if "allabhad" is a valid city name...
[LLM]: LLM verification response
└─ Details: Allahabad
```

### 6. User Confirmation
```
[INFO]: Potential city correction detected: allabhad → Allahabad
[INFO]: User confirmation for correction: yes
```

### 7. Weather Query to LLM
```
[LLM]: Sending weather query to LLM
└─ Details: What's the weather in Allahabad?
[LLM]: LLM weather response
```

### 8. Tool Execution
```
[WEATHER]: Fetching weather for: Allahabad
```

### 9. Weather Results
```
[WEATHER]: Weather result received
└─ Details: Temperature: 37.29°C, Conditions: clear sky, Humidity: 4%
```

### 10. Session Completion
```
[CLIENT]: Closing server connection
[INFO]: User response to continue: no
```

## Technical Implementation

### Transport Layer
The client and server communicate via standard I/O:

```javascript
const transport = new StdioClientTransport({
    command: 'node',
    args: ['../server/build/index.js']
});
```

### Tool Definition
The server defines tools using a schema-based approach:

```javascript
server.tool(
  'get_weather',
  { city: z.string() },  // Schema using Zod
  async ({ city }) => {  // Implementation
    // API call to OpenWeatherMap
  }
);
```

### LLM Integration
The client connects to Google's Gemini using their SDK:

```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
});
```

## Logging System

### Key Features
- **File-Only Logging**: Logs are written only to files, not to the console
- **Automatic File Creation**: Creates a logs directory with timestamped log files
- **Structured Log Entries**: Each entry includes timestamp, log level, message, and optional data
- **Clean Shutdown**: Properly closes file streams when the application exits
- **Lazy Initialization**: Logger initializes only when the first log is written

### Log Structure
Each log entry includes:
- Timestamp
- Log level (INFO, ERROR, LLM, etc.)
- Message
- Optional detailed data

## Model Context Protocol (MCP)

The MCP framework enables structured interaction between the client and server:

1. **Standardized Communication**
   - Discover available tools (`client.listTools()`)
   - Understand how to call tools (through input schemas)
   - Call tools with appropriate parameters (`client.callTool()`)

2. **Tool Registration**
   - Register tools with unique names (e.g., "get_weather")
   - Define input schemas using Zod for validation
   - Implement the actual functionality

3. **Transport Layer**
   - Abstracts communication methods
   - Currently using stdio
   - Extensible to other transport methods

## Design Philosophy

The architecture follows these principles:

1. **Component Separation**
   - Client focuses on user experience
   - Server focuses on specialized tools and API access
   - LLM focuses on natural language understanding

2. **Extensibility**
   - Easy to add new weather-related tools
   - Client can discover and use new tools automatically

3. **Error Handling and User Experience**
   - Spelling correction through LLM
   - User confirmation for corrections
   - Detailed logging of all interactions

4. **Progressive Enhancement**
   - Basic functionality with simple city names
   - LLM adds spelling correction
   - Potential for further enhancements

## Getting Started

### Prerequisites
- Node.js
- Google Gemini API key
- OpenWeatherMap API key

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   cd client && npm install
   cd ../server && npm install
   ```
3. Set up environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   ```

### Running the Application
1. Build the client and server:
   ```
   cd client && npm run build
   cd ../server && npm run build
   ```
2. Run the client:
   ```
   cd client && node build/index.js
   ```

## Logs
Logs are saved in the `logs` directory in your client folder. Each log file has a timestamp and contains detailed information about the application's execution.
