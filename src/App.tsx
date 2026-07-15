import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, ClipboardList, Trash2, RefreshCw, CheckCircle } from "lucide-react";
import Header from "./components/Header";
import SchedulesTable from "./components/SchedulesTable";
import BackupUtility from "./components/BackupUtility";
import { MeetingMinutesParser } from "./utils/parser";
import { ScheduleItem } from "./types";

const DEFAULT_TEAM_MEMBERS = ["홍길동 대리", "김 대리", "이 과장", "박 사원", "최 팀장"];

export default function App() {
  // --- Persistent Core States ---
  const [meetingInput, setMeetingInput] = useState("");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [referenceDate, setReferenceDate] = useState("2026-07-14");
  const [teamMembers, setTeamMembers] = useState<string[]>(DEFAULT_TEAM_MEMBERS);

  // --- UI States ---
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Parser instance (SOLID: Single Responsibility & Interface Conformance)
  const meetingParser = useRef(new MeetingMinutesParser());

  // --- Initialize States from LocalStorage ---
  useEffect(() => {
    try {
      const storedMeeting = localStorage.getItem("ds_meeting_input");
      const storedSchedules = localStorage.getItem("ds_schedules");
      const storedDate = localStorage.getItem("ds_reference_date");
      const storedTeam = localStorage.getItem("ds_team_members");

      if (storedMeeting) setMeetingInput(storedMeeting);
      if (storedSchedules) setSchedules(JSON.parse(storedSchedules));
      if (storedDate) {
        setReferenceDate(storedDate);
      } else {
        // Set dynamic date based on local current time (from user metadata: 2026-07-14)
        setReferenceDate("2026-07-14");
      }
      if (storedTeam) setTeamMembers(JSON.parse(storedTeam));
    } catch (e) {
      console.error("Failed to load local storage values", e);
    }
  }, []);

  // --- Handle Persisting & Auto-saving with debouncing (REQ-01) ---
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSaveStatus("saving");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("ds_meeting_input", meetingInput);
        localStorage.setItem("ds_schedules", JSON.stringify(schedules));
        localStorage.setItem("ds_reference_date", referenceDate);
        localStorage.setItem("ds_team_members", JSON.stringify(teamMembers));
        setSaveStatus("saved");
      } catch (e) {
        console.error("Local save failed", e);
      }
    }, 800);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [meetingInput, schedules, referenceDate, teamMembers]);

  // --- Actions ---

  // 1. Extract Meeting Schedules (REQ-03)
  const handleExtractSchedules = () => {
    if (!meetingInput.trim()) {
      showToast("회의록 내용을 입력해 주세요.");
      return;
    }

    const result = meetingParser.current.parse(meetingInput, {
      referenceDate,
      customNames: teamMembers
    });

    if (result.success) {
      setSchedules(result.schedules);
      showToast(`${result.schedules.length}개의 일정을 회의록에서 추출했습니다!`);
    } else {
      showToast(result.error || "일정 추출에 실패했습니다.");
    }
  };

  // 2. Import / Restore Backup (REQ-09)
  const handleRestoreBackup = (data: { meetingText: string; teamMembers?: string[] }) => {
    setMeetingInput(data.meetingText);
    if (data.teamMembers && data.teamMembers.length > 0) {
      setTeamMembers(data.teamMembers);
    }
    showToast("성공적으로 백업본을 복구했습니다.");
  };

  // 3. Reset application
  const handleClearAll = () => {
    if (window.confirm("정말 모든 입력 내용과 캐시 데이터를 지우시겠습니까?")) {
      setMeetingInput("");
      setSchedules([]);
      setReferenceDate("2026-07-14");
      setTeamMembers(DEFAULT_TEAM_MEMBERS);
      localStorage.clear();
      showToast("초기화가 완료되었습니다.");
    }
  };

  // Utility toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load sample content for user playground (usability enhancement)
  const handleLoadSample = (type: "meeting" | "report") => {
    setMeetingInput(`- 7월 20일까지 홍길동 대리는 DailySync 개발 완료하기로 함.
- 김 대리는 내일 오전까지 디자인 시안 송부 바람.
- 이번주 금요일까지 박 사원은 사용자 설문 조사 보고서 작성 완료 대기.
- 차주 월요일 이 과장님 신규 마케팅 예산 보고서 제출할 것.
- 7/18까지 모두들 업무 인수인계 문서 업데이트 필수.`);
    showToast("회의록 샘플을 불러왔습니다. [일정 추출하기]를 클릭하세요!");
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-900 selection:bg-slate-900 selection:text-white pb-12">
      
      {/* Dynamic Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl border border-slate-800"
          >
            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Component */}
      <Header
        referenceDate={referenceDate}
        setReferenceDate={setReferenceDate}
        teamMembers={teamMembers}
        setTeamMembers={setTeamMembers}
        onLoadSample={handleLoadSample}
      />

      {/* Application Main Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Workspace Quick Guide & Auto-Save Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800">오프라인 보존:</span>            {/* Quick playground load */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>예시 데이터:</span>
              <button
                onClick={() => handleLoadSample("meeting")}
                className="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-2 transition-colors cursor-pointer font-semibold"
              >
                주간 회의록 샘플
              </button>
            </div>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* ================= LEFT COLUMN: INPUT WORKSPACE ================= */}
          <section className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Input Workspace Header */}
            <div className="border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                <h3 className="font-display font-semibold text-sm text-slate-900">주간 회의록 작성 및 분석</h3>
              </div>

              {/* Utility action */}
              <button
                onClick={() => setMeetingInput("")}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                title="현재 입력 내용 비우기"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Meeting Minutes Inputs */}
            <div className="flex-1 p-4 space-y-4 flex flex-col h-full">
              <div className="text-xs text-slate-500 leading-relaxed">
                구두 협의된 내용을 자유롭게 기술하거나 주간 회의록을 붙여넣으세요. <br />
                문장 내의 날짜 표현(<span className="text-indigo-600 font-semibold">"오늘", "내일", "7월 20일", "이번주 금요일"</span>) 및 등록된 팀원 이름을 결합하여 실제 일정표로 즉시 파싱합니다.
              </div>

              <div className="flex-1 relative">
                <textarea
                  value={meetingInput}
                  onChange={(e) => setMeetingInput(e.target.value)}
                  placeholder={`예시 회의 발언/회의록 양식:\n- 7월 20일까지 홍길동 대리는 DailySync 개발 완료하기로 함.\n- 김 대리는 내일 오전까지 디자인 시안 송부 바람.\n- 이번주 금요일까지 박 사원은 사용자 설문 조사 보고서 작성 완료 대기.`}
                  className="w-full h-80 min-h-[250px] p-4 rounded-lg border border-slate-200 font-sans text-xs leading-relaxed focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 resize-none bg-slate-50/20"
                  id="textarea-meeting-input"
                />
                <div className="absolute bottom-2.5 right-2.5 bg-white border border-slate-200 rounded px-2 py-0.5 font-mono text-[9px] text-slate-400">
                  {meetingInput.length}자 / {meetingInput.split("\n").filter(Boolean).length}줄
                </div>
              </div>

              {/* Schedule Extract CTA Button */}
              <button
                onClick={handleExtractSchedules}
                disabled={!meetingInput.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-45 disabled:pointer-events-none shadow-xs cursor-pointer"
                id="btn-process-meeting"
              >
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <span>회의록에서 스마트 일정 추출하기</span>
              </button>
            </div>

          </section>

          {/* ================= RIGHT COLUMN: OUTPUT WORKSPACE ================= */}
          <section className="h-full">
            <SchedulesTable
              schedules={schedules}
              setSchedules={setSchedules}
              referenceDate={referenceDate}
            />
          </section>

        </div>

        {/* File Backup Utility Component */}
        <BackupUtility
          meetingText={meetingInput}
          teamMembers={teamMembers}
          onRestore={handleRestoreBackup}
          onClearAll={handleClearAll}
        />

      </main>
    </div>
  );
}
