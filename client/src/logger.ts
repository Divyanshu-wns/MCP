import * as fs from 'fs';
import * as path from 'path';

// Simple logger utility that writes only to a file, not the console
enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  LLM = 'LLM',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  WEATHER = 'WEATHER'
}

export class Logger {
  private static logStream: fs.WriteStream;
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    // Create logs directory in the project root
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Create a log file with timestamp in filename
    const logFile = path.resolve(logsDir, `weather-app-${new Date().toISOString().replace(/:/g, '-')}.log`);
    this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    // Log the initialization
    this.writeToFile(`Logger initialized. Logs will be saved to: ${logFile}`);
    
    this.initialized = true;
    
    // Set up process exit handler to close the log file
    process.on('exit', () => {
      this.close();
    });
  }

  private static writeToFile(message: string) {
    if (!this.initialized) this.initialize();
    this.logStream.write(message + '\n');
  }

  static close() {
    if (this.initialized && this.logStream) {
      this.logStream.end();
    }
  }

  static log(level: LogLevel, message: string, data?: any) {
    if (!this.initialized) this.initialize();
    
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}]: ${message}`;
    
    if (data) {
      const dataString = typeof data === 'string' 
        ? data 
        : JSON.stringify(data, null, 2);
      logMessage += `\n  └─ Details: ${dataString}`;
    }
    
    this.writeToFile(logMessage);
  }

  static info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  static error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  static llm(message: string, data?: any) {
    this.log(LogLevel.LLM, message, data);
  }

  static server(message: string, data?: any) {
    this.log(LogLevel.SERVER, message, data);
  }

  static client(message: string, data?: any) {
    this.log(LogLevel.CLIENT, message, data);
  }

  static weather(message: string, data?: any) {
    this.log(LogLevel.WEATHER, message, data);
  }
}