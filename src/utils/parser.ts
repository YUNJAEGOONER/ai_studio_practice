import { ScheduleItem, ParserResult, ReportParser, ParserOptions } from "../types";

/**
 * Utility to parse relative dates in Korean.
 * Today is assumed to be the provided referenceDate (defaults to '2026-07-14').
 */
export function resolveRelativeKoreanDate(text: string, referenceDateStr: string): { dateStr: string; matchedText: string } | null {
  const refDate = new Date(referenceDateStr);
  if (isNaN(refDate.getTime())) return null;

  // Cleanup input text to search for date patterns
  const cleanText = text.trim();

  // Helper to format date
  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // 1. Direct YYYY-MM-DD
  const ymdRegex = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/;
  const ymdMatch = cleanText.match(ymdRegex);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1]);
    const month = parseInt(ymdMatch[2]) - 1;
    const day = parseInt(ymdMatch[3]);
    const target = new Date(year, month, day);
    return { dateStr: formatDate(target), matchedText: ymdMatch[0] };
  }

  // 2. M월 D일 or M/D (without year)
  const mdRegex = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
  const mdMatch = cleanText.match(mdRegex);
  if (mdMatch) {
    const month = parseInt(mdMatch[1]) - 1;
    const day = parseInt(mdMatch[2]);
    const target = new Date(refDate.getFullYear(), month, day);
    // If the date resolved is way in the past (e.g. current is Dec, parsed is Jan), assume next year, but typically same year is fine
    return { dateStr: formatDate(target), matchedText: mdMatch[0] };
  }

  const slashRegex = /\b(\d{1,2})\/(\d{1,2})\b/;
  const slashMatch = cleanText.match(slashRegex);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]) - 1;
    const day = parseInt(slashMatch[2]);
    const target = new Date(refDate.getFullYear(), month, day);
    return { dateStr: formatDate(target), matchedText: slashMatch[0] };
  }

  // 3. Relative terms: 오늘, 내일, 모레, 어제
  if (/오늘/.test(cleanText)) {
    return { dateStr: formatDate(refDate), matchedText: "오늘" };
  }
  if (/내일/.test(cleanText)) {
    const target = new Date(refDate);
    target.setDate(refDate.getDate() + 1);
    return { dateStr: formatDate(target), matchedText: "내일" };
  }
  if (/모레/.test(cleanText)) {
    const target = new Date(refDate);
    target.setDate(refDate.getDate() + 2);
    return { dateStr: formatDate(target), matchedText: "모레" };
  }
  if (/어제/.test(cleanText)) {
    const target = new Date(refDate);
    target.setDate(refDate.getDate() - 1);
    return { dateStr: formatDate(target), matchedText: "어제" };
  }

  // 4. Day of the week patterns
  // "이번주 금요일", "다음주 월요일", "차주 수요일"
  // Day map: 일=0, 월=1, 화=2, 수=3, 목=4, 금=5, 토=6
  const dayMap: { [key: string]: number } = {
    "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6,
    "일요일": 0, "월요일": 1, "화요일": 2, "수요일": 3, "목요일": 4, "금요일": 5, "토요일": 6
  };

  const weekRegex = /(이번주|다음주|차주|금주)\s*([월화수목금토일](?:요일)?)/;
  const weekMatch = cleanText.match(weekRegex);
  if (weekMatch) {
    const weekType = weekMatch[1]; // 이번주/금주 vs 다음주/차주
    const targetDayName = weekMatch[2].charAt(0); // just grab '월', '화' etc.
    const targetDayOfWeek = dayMap[targetDayName];

    if (targetDayOfWeek !== undefined) {
      const currentDayOfWeek = refDate.getDay();
      let diff = targetDayOfWeek - currentDayOfWeek;

      if (weekType === "다음주" || weekType === "차주") {
        // Next week is current day offset to next week Monday plus day difference from Monday
        // Or simply: (7 - currentDayOfWeek) + targetDayOfWeek
        diff = (7 - currentDayOfWeek) + targetDayOfWeek;
      } else {
        // "이번주" or "금주": could be positive or negative relative to today.
        // e.g. if today is Tuesday(2) and target is Friday(5), diff is +3.
        // if today is Tuesday(2) and target is Monday(1), diff is -1 (which is correct for "this Monday").
      }

      const target = new Date(refDate);
      target.setDate(refDate.getDate() + diff);
      return { dateStr: formatDate(target), matchedText: weekMatch[0] };
    }
  }

  return null;
}

/**
 * Smart status detector based on Korean sentence endings
 */
export function autoDetectStatus(text: string): "완료" | "진행" | "대기" {
  const trimmed = text.trim();
  
  // High confidence 완료 (completed) keywords
  if (
    /완료|끝냄|참석|회의록 정리|제출|보고|셋업|설치 완료|배포|구축|수정 완료|해결/.test(trimmed) &&
    !/예정|대기|진행중|진행 중/.test(trimmed)
  ) {
    return "완료";
  }

  // High confidence 대기 (pending/blocked) keywords
  if (/대기|피드백 요청|검토 중|검토 대기|승인 대기|보류/.test(trimmed)) {
    return "대기";
  }

  // Fallback to 진행 (in progress) for active verbs or defaults
  if (/진행|작성|개발|구현|회의|테스트|수정|조사|검토|분석/.test(trimmed)) {
    return "진행";
  }

  return "진행"; // default is in progress
}

/**
 * Predefined report layouts
 */
export const REPORT_TEMPLATES = [
  {
    id: "standard",
    name: "기본 템플릿 (팀장님 선호형)",
    description: "진행 업무, 이슈, 내일 예정 사항을 명확히 분류한 주 표준 보고 서식",
    generate: (sections: { work: string[]; issues: string[]; nextDay: string[] }, dateStr: string) => {
      const renderLines = (lines: string[]) => lines.length > 0 ? lines.map(l => `* ${l}`).join("\n") : "* 진행 사항 없음";
      const renderIssues = (lines: string[]) => lines.length > 0 ? lines.map(l => `* ${l}`).join("\n") : "* 특이사항 없음";
      
      return `## [일일 업무 보고] ${dateStr}

### 1. 금일 진행 업무
${renderLines(sections.work)}

### 2. 특이사항 및 이슈
${renderIssues(sections.issues)}

### 3. 내일 예정 사항
${renderLines(sections.nextDay)}`;
    }
  },
  {
    id: "detailed",
    name: "상세 진척률 템플릿 (마일스톤 중심)",
    description: "각 태스크별 상태 표시와 진행률을 가시화한 서식",
    generate: (sections: { work: string[]; issues: string[]; nextDay: string[] }, dateStr: string) => {
      const mapDetailed = (lines: string[], defaultStatus: string) => {
        if (lines.length === 0) return ["- [ ] 특이사항 없음"];
        return lines.map(l => {
          let statusLabel = `[${defaultStatus}]`;
          if (l.startsWith("[완료]")) {
            statusLabel = "🟢 [완료]";
            l = l.replace("[완료]", "").trim();
          } else if (l.startsWith("[진행]")) {
            statusLabel = "🔵 [진행]";
            l = l.replace("[진행]", "").trim();
          } else if (l.startsWith("[대기]")) {
            statusLabel = "🟡 [대기]";
            l = l.replace("[대기]", "").trim();
          }
          return `- ${statusLabel} ${l}`;
        });
      };

      const workLines = mapDetailed(sections.work, "진행");
      const issueLines = mapDetailed(sections.issues, "이슈");
      const nextLines = sections.nextDay.length > 0 ? sections.nextDay.map(l => `- 🗓️ [예정] ${l.replace(/^\[(?:진행|완료|대기)\]\s*/, "")}`) : ["- 🗓️ 예정 사항 없음"];

      return `# 📌 Daily Work Report - ${dateStr}

## 📋 금일 업무 실적
${workLines.join("\n")}

## ⚠️ 이슈 및 협조 사항
${issueLines.join("\n")}

## 🚀 내일 계획
${nextLines.join("\n")}

---
*본 보고서는 DailySync를 통해 가공되었습니다.*`;
    }
  }
];

/**
 * DailyReportParser: Client-side Rule-based text formatter for daily notes.
 * Categorizes lines into Work, Issues, NextDay sections and formats them.
 */
export class DailyReportParser implements ReportParser {
  parse(rawData: string, options?: ParserOptions): ParserResult {
    if (!rawData || rawData.trim().length === 0) {
      return {
        success: false,
        formattedText: "",
        schedules: [],
        error: "분석할 텍스트가 존재하지 않습니다."
      };
    }

    const refDate = options?.referenceDate || "2026-07-14";
    const lines = rawData.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const work: string[] = [];
    const issues: string[] = [];
    const nextDay: string[] = [];

    lines.forEach(line => {
      // Clean up common bullet prefixes like -, *, 1. etc
      const cleanedLine = line.replace(/^[-*•\d.]\s*/, "").trim();
      
      // Auto-detect status
      const detectedStatus = autoDetectStatus(cleanedLine);
      const statusPrefix = `[${detectedStatus}]`;
      const finalLine = `${statusPrefix} ${cleanedLine}`;

      // Check section categorization based on keywords
      if (/이슈|특이|문제|막힘|버그|에러|대기|장애|협조/.test(cleanedLine)) {
        issues.push(finalLine);
      } else if (/내일|차일|예정|수행할|다음주|차주|계획|목표/.test(cleanedLine)) {
        nextDay.push(finalLine);
      } else {
        work.push(finalLine);
      }
    });

    // Generate markdown with standard template by default
    const formattedText = REPORT_TEMPLATES[0].generate({ work, issues, nextDay }, refDate);

    return {
      success: true,
      formattedText,
      schedules: [] // Daily report parser conforms to LSP by returning empty schedules
    };
  }
}

/**
 * MeetingMinutesParser: Parses weekly meeting minutes to extract schedules and action items.
 * Extracts `[마감일 - 담당자 - 수행 과제]`.
 */
export class MeetingMinutesParser implements ReportParser {
  parse(rawData: string, options?: ParserOptions): ParserResult {
    if (!rawData || rawData.trim().length === 0) {
      return {
        success: false,
        formattedText: "",
        schedules: [],
        error: "분석할 텍스트가 존재하지 않습니다."
      };
    }

    const refDate = options?.referenceDate || "2026-07-14";
    const customNames = options?.customNames || [];
    const lines = rawData.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const schedules: ScheduleItem[] = [];

    // Names list to help match assignees
    // Built-in list of common Korean family names + typical given names, and business titles
    const titles = ["님", "대리", "과장", "사원", "선임", "책임", "팀장", "부장", "차장", "주임", "연구원", "파트장"];
    
    lines.forEach((line, index) => {
      // Search for dates
      const dateResult = resolveRelativeKoreanDate(line, refDate);
      const dateStr = dateResult ? dateResult.dateStr : "기한 미정";
      const dateToken = dateResult ? dateResult.matchedText : "";

      // Search for assignee
      let assignee = "담당자 미정";
      let matchedNameText = "";

      // 1. Try custom configured names first
      if (customNames.length > 0) {
        for (const name of customNames) {
          if (name.trim() && line.includes(name.trim())) {
            assignee = name.trim();
            matchedNameText = name.trim();
            break;
          }
        }
      }

      // 2. Try looking for names with titles if customNames didn't match or is empty
      if (assignee === "담당자 미정") {
        for (const title of titles) {
          const titleRegex = new RegExp(`([가-힣]{2,4})\\s*${title}`);
          const match = line.match(titleRegex);
          if (match) {
            assignee = `${match[1]} ${title}`;
            matchedNameText = match[0];
            break;
          }
        }
      }

      // 3. Regex match for "담당자: OOO" or "담당: OOO"
      if (assignee === "담당자 미정") {
        const managerRegex = /(?:담당자|담당)\s*:\s*([가-힣]{2,4})/;
        const match = line.match(managerRegex);
        if (match) {
          assignee = match[1];
          matchedNameText = match[0];
        }
      }

      // 4. Try 2-3 character Korean word context that might be a name
      // e.g., "홍길동 업무 완료", "이영희 개발 진행" -> check common name matching
      if (assignee === "담당자 미정") {
        // Look for common name structure near verbs
        const words = line.split(/\s+/);
        for (const word of words) {
          // Check if word matches 2-3 characters of Korean (simple name matcher)
          if (/^[가-힣]{2,3}$/.test(word)) {
            // Exclude common words like "오늘", "내일", "회의", "업무", "진행", "보고", "이슈", "일정", "마감"
            const nonNames = ["오늘", "내일", "모레", "어제", "회의", "업무", "진행", "보고", "이슈", "일정", "마감", "특이", "수정", "개발", "배포", "참석", "내용", "정리", "오전", "오후", "이번", "다음", "차주", "금주", "기한", "완료", "대기", "계획", "과제", "안건", "의견", "결정", "합의", "부서", "팀원", "대표", "전체", "모두"];
            if (!nonNames.includes(word)) {
              assignee = word;
              matchedNameText = word;
              break;
            }
          }
        }
      }

      // Extract task by stripping date token and assignee token from the sentence
      let task = line;
      
      // Clean up punctuation prefix
      task = task.replace(/^[-*•\d.]\s*/, "");

      // Strip date matched text
      if (dateToken) {
        task = task.replace(dateToken, "");
      }
      // Strip assignee matched text
      if (matchedNameText) {
        task = task.replace(matchedNameText, "");
      }

      // Clean up common fluff words
      task = task.replace(/(?:담당자|담당)\s*:\s*/g, "");
      task = task.replace(/\s*:\s*/g, " ");
      task = task.replace(/\s+/g, " ").trim();

      // Ensure some task text exists, fallback to original line trimmed if empty
      if (task.length === 0 || task === "-" || task === "*") {
        task = line;
      }

      // Cap length and format beautifully
      if (task.length > 80) {
        task = task.substring(0, 77) + "...";
      }

      schedules.push({
        id: `sched-${index}-${Date.now()}`,
        date: dateStr,
        assignee,
        task,
        originalText: line
      });
    });

    // Formatted Text Summary representing the schedules
    const summaryLines = schedules.map(s => `[${s.date}] ${s.task} - 담당자: ${s.assignee}`);
    const formattedText = `### 📅 주간 회의 주요 일정 요약\n\n` + 
      (summaryLines.length > 0 
        ? summaryLines.map(line => `* ${line}`).join("\n")
        : "* 추출된 일정이 없습니다.");

    return {
      success: true,
      formattedText,
      schedules
    };
  }
}
