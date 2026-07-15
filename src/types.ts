/**
 * DailySync Core Types
 * Follows the SOLID design principles requested in the PRD.
 */

export interface ScheduleItem {
  id: string;
  date: string;       // Formatted date (e.g. "2026-07-20" or "기한 미정")
  assignee: string;   // Person assigned (e.g. "홍길동" or "담당자 미정")
  task: string;       // Action item / task description
  originalText: string; // The original sentence from the notes
}

export interface ParserResult {
  success: boolean;
  formattedText: string;
  schedules: ScheduleItem[];
  error?: string;
}

/**
 * Report Parser Interface
 * Satisfies the Liskov Substitution Principle (LSP).
 * All parsers conform to this interface.
 */
export interface ReportParser {
  parse(rawData: string, options?: ParserOptions): ParserResult;
}

export interface ParserOptions {
  referenceDate?: string; // Standard date to calculate relative terms ("오늘", "내일")
  customNames?: string[]; // Extra names to recognize
}

export interface DailyReportTemplate {
  id: string;
  name: string;
  description: string;
  generate: (sections: { work: string[]; issues: string[]; nextDay: string[] }, dateStr: string) => string;
}
