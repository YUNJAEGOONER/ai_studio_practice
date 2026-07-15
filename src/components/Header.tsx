import React from "react";
import { Calendar, Users, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

interface HeaderProps {
  referenceDate: string;
  setReferenceDate: (date: string) => void;
  teamMembers: string[];
  setTeamMembers: (members: string[]) => void;
  onLoadSample: (type: "report" | "meeting") => void;
}

export default function Header({
  referenceDate,
  setReferenceDate,
  teamMembers,
  setTeamMembers,
  onLoadSample
}: HeaderProps) {
  const [newMember, setNewMember] = React.useState("");
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMember.trim();
    if (name && !teamMembers.includes(name)) {
      setTeamMembers([...teamMembers, name]);
      setNewMember("");
    }
  };

  const handleRemoveMember = (name: string) => {
    setTeamMembers(teamMembers.filter(m => m !== name));
  };

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm flex-shrink-0">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl select-none font-display shadow-xs">
              DS
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-800 flex items-center flex-wrap gap-2">
                DailySync 
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-wider uppercase font-mono">
                  v1.0 MVP
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                비용 0원, 브라우저 내에서 안전하게 동작하는 신입사원 주간 회의록 일정 추출기
              </p>
            </div>
          </div>

          {/* Quick Actions, Status Badges & Configuration */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Client-side Engine Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase tracking-wider font-mono">
                Client-side Engine Active
              </span>
            </div>

            {/* Sync State */}
            <div className="hidden md:block text-right text-[11px] text-slate-500 font-mono border-r border-slate-200 pr-3 mr-1">
              <div className="font-bold text-slate-700">Sync status</div>
              <div>Local Storage: OK</div>
            </div>

            {/* Reference Date Control */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="font-medium">기준일:</span>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="bg-transparent font-mono font-bold focus:outline-hidden text-slate-900 cursor-pointer focus:text-indigo-600"
                title="상대적 일자('오늘', '내일', '금요일') 계산의 기준이 됩니다."
              />
            </div>

            {/* Team Members Button */}
            <button
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition"
              title="팀원 이름을 등록하면 회의록 일정 추출률이 대폭 향상됩니다."
              id="btn-team-config"
            >
              <Users className="h-4 w-4 text-slate-500" />
              <span>팀원 ({teamMembers.length}명)</span>
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition"
              title="도움말 보기"
              id="btn-help"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Team Member Config Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                팀원 등록 (추출 정밀도 향상)
              </h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              사전에 팀원들의 이름이나 직함을 등록해두면 회의록 텍스트에서 <b className="text-slate-800">담당자 정보</b>를 정확하게 탐지하여 일정을 추출해 드립니다.
            </p>

            <form onSubmit={handleAddMember} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="예: 홍길동 대리, 이영희, 박 사원"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                추가
              </button>
            </form>

            <div className="mt-4 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50">
              {teamMembers.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">등록된 팀원이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map(member => (
                    <span
                      key={member}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-200 pl-2.5 pr-1.5 py-1 text-xs font-medium text-slate-700 shadow-3xs"
                    >
                      {member}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTeamModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-semibold text-slate-800 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                DailySync 사용 가이드
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">💡 DailySync란 무엇인가요?</h4>
                <p className="mt-1">
                  유료 AI API 비용 부담 없이 정규식과 한국어 문맥 분석 룰셋만으로 주간 회의록에서 일정을 스마트하게 추출하고 정리해 주는 <b className="text-slate-800">100% 클라이언트 사이드 개인용 생산성 도구</b>입니다.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm">📅 회의록 일정 파싱 팁</h4>
                <p className="mt-1">
                  회의 중 나온 발언이나 요약을 입력하면 <b className="text-indigo-600">"오늘", "내일", "이번주 금요일", "7월 20일", "7/18"</b> 등 다양한 기한 표현을 자동 계산하여 실제 날짜(YYYY-MM-DD)로 변환해 줍니다. <b className="text-slate-800">팀원 이름</b>을 미리 등록해두시면 담당자 매칭이 더 원활해집니다!
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">보안 및 개인정보 준수</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    작성한 모든 회의록과 추출된 일정은 브라우저 내부 LocalStorage에만 저장되며 외부 서버나 LLM으로 전송되지 않습니다. 안심하고 사내 기밀 회의 데이터를 작성해 보관하세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onLoadSample("meeting"); setShowHelp(false); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer font-semibold"
                >
                  회의록 샘플 불러오기
                </button>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
