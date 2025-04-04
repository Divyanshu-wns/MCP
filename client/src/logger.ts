import * as fs from 'fs';
import * as path from 'path';

// Enhanced logger utility that writes to a file and optionally to the console
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  LLM = 'LLM',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  WEATHER = 'WEATHER',
  DATA_FLOW = 'DATA_FLOW'
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Log level colors
const levelColors = {
  [LogLevel.DEBUG]: colors.cyan,
  [LogLevel.INFO]: colors.green,
  [LogLevel.WARNING]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
  [LogLevel.LLM]: colors.magenta,
  [LogLevel.SERVER]: colors.blue,
  [LogLevel.CLIENT]: colors.green,
  [LogLevel.WEATHER]: colors.cyan,
  [LogLevel.DATA_FLOW]: colors.bright + colors.yellow
};

export interface LoggerConfig {
  consolePrint?: boolean;  // Whether to also print logs to console
  maxFileSize?: number;    // Max log file size in bytes before rotation
  logDir?: string;         // Custom log directory
  logPrefix?: string;      // Prefix for log files
}

export class Logger {
  private static logStream: fs.WriteStream;
  private static initialized = false;
  private static currentLogFile: string;
  private static config: LoggerConfig = {
    consolePrint: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB default
    logDir: 'logs',
    logPrefix: 'weather-app'
  };

  /**
   * Configure the logger
   */
  static configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
    
    // Re-initialize if already initialized
    if (this.initialized) {
      this.close();
      this.initialized = false;
      this.initialize();
    }
  }

  /**
   * Initialize the logger
   */
  static initialize() {
    if (this.initialized) return;

    // Create logs directory
    const logsDir = path.resolve(process.cwd(), this.config.logDir || 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a log file with timestamp in filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    this.currentLogFile = path.resolve(logsDir, `${this.config.logPrefix}-${timestamp}.log`);
    this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
    
    // Set initialized to true before writing to file
    this.initialized = true;
    
    // Log the initialization
    this.logStream.write(`Logger initialized. Logs will be saved to: ${this.currentLogFile}\n`);
    
    // Set up process exit handler to close the log file
    process.on('exit', () => {
      this.close();
    });
  }

  /**
   * Check if log file needs rotation and rotate if necessary
   */
  private static checkRotation() {
    try {
      if (!this.currentLogFile) return;
      
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= (this.config.maxFileSize || 10 * 1024 * 1024)) {
        // Close current stream
        this.logStream.end();
        
        // Create new log file
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
        const logsDir = path.resolve(process.cwd(), this.config.logDir || 'logs');
        this.currentLogFile = path.resolve(logsDir, `${this.config.logPrefix}-${timestamp}.log`);
        this.logStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
        
        this.logStream.write(`Log file rotated from previous file due to size limit\n`);
      }
    } catch (error) {
      // Type check the error before accessing properties
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        console.error('Error checking log file size:', error);
      }
    }
  }

  /**
   * Write message to log file
   */
  private static writeToFile(message: string) {
    if (!this.initialized) this.initialize();
    this.checkRotation();
    this.logStream.write(message + '\n');
  }

  /**
   * Close the log file
   */
  static close() {
    if (this.initialized && this.logStream) {
      this.logStream.end();
    }
  }

  /**
   * Log a message with specified level
   */
  static log(level: LogLevel, message: string, data?: any) {
    if (!this.initialized) this.initialize();
    
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}]: ${message}`;
    
    // Format data if present
    let dataString = '';
    if (data) {
      if (typeof data === 'string') {
        dataString = data;
      } else {
        try {
          dataString = JSON.stringify(data, null, 2);
        } catch (e) {
          dataString = String(data);
        }
      }
      logMessage += `\n  └─ Details: ${dataString}`;
    }
    
    // Write to file
    this.writeToFile(logMessage);
    
    // Print to console if enabled
    if (this.config.consolePrint) {
      const color = levelColors[level] || colors.white;
      console.log(`${color}[${timestamp}] [${level}]: ${message}${colors.reset}`);
      if (dataString) {
        console.log(`${colors.dim}  └─ Details: ${dataString}${colors.reset}`);
      }
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  static info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  static warning(message: string, data?: any) {
    this.log(LogLevel.WARNING, message, data);
  }

  /**
   * Log error message
   */
  static error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Log LLM-related message
   */
  static llm(message: string, data?: any) {
    this.log(LogLevel.LLM, message, data);
  }

  /**
   * Log server-related message
   */
  static server(message: string, data?: any) {
    this.log(LogLevel.SERVER, message, data);
  }

  /**
   * Log client-related message
   */
  static client(message: string, data?: any) {
    this.log(LogLevel.CLIENT, message, data);
  }

  /**
   * Log weather-related message
   */
  static weather(message: string, data?: any) {
    this.log(LogLevel.WEATHER, message, data);
  }

  /**
   * Log data flow information specifically
   */
  static dataFlow(message: string, data?: any) {
    this.log(LogLevel.DATA_FLOW, message, data);
  }
}