import * as fs from 'fs';
import * as path from 'path';

export class ScheduleLogger {
  private static logDir = 'logs';
  private static logFile = 'schedule.log';

  private static ensureLogDirectory() {
    const logPath = path.join(process.cwd(), this.logDir);
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
  }

  static log(message: string) {
    this.ensureLogDirectory();
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    const logPath = path.join(process.cwd(), this.logDir, this.logFile);
    
    fs.appendFileSync(logPath, logMessage);
  }
} 