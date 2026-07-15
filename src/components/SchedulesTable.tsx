import React from "react";
import { ScheduleItem } from "../types";
import { Copy, Check, Calendar, User, ClipboardList, Trash2, Plus, Edit2, CheckCircle2, X } from "lucide-react";

interface SchedulesTableProps {
  schedules: ScheduleItem[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  referenceDate: string;
}

export default function SchedulesTable({
  schedules,
  setSchedules,
  referenceDate
}: SchedulesTableProps) {
  const [copied, setCopied] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  
  // Inline edit state
  const [editDate, setEditDate] = React.useState("");
  const [editAssignee, setEditAssignee] = React.useState("");
  const [editTask, setEditTask] = React.useState("");

  // New item form state
  const [newDate, setNewDate] = React.useState(referenceDate);
  const [newAssignee, setNewAssignee] = React.useState("");
  const [newTask, setNewTask] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleStartEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setEditDate(item.date);
    setEditAssignee(item.assignee);
    setEditTask(item.task);
  };

  const handleSaveEdit = (id: string) => {
    setSchedules(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, date: editDate || "기한 미정", assignee: editAssignee || "담당자 미정", task: editTask || "할 일 없음" }
          : item
      )
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(item => item.id !== id));
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const taskText = newTask.trim();
    if (!taskText) return;

    const newItem: ScheduleItem = {
      id: `sched-manual-${Date.now()}`,
      date: newDate || "기한 미정",
      assignee: newAssignee.trim() || "담당자 미정",
      task: taskText,
      originalText: "[수동 등록 일정]"
    };

    setSchedules(prev => [newItem, ...prev]);
    setNewAssignee("");
    setNewTask("");
    setShowAddForm(false);
  };

  // Plain-text Summary Generation as specified in REQ-04 of PRD: [2026-07-20] OOO 업무 완료 - 담당자: 홍길동
  const generatePlainText = () => {
    if (schedules.length === 0) return "추출되거나 등록된 일정이 존재하지 않습니다.";
    return schedules
      .map(s => `[${s.date}] ${s.task} - 담당자: ${s.assignee}`)
      .join("\n");
  };

  const handleCopyText = async () => {
    try {
      const text = generatePlainText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-slate-700" />
          <h3 className="font-display font-semibold text-sm text-slate-900">추출된 일정 및 액션 아이템 목록</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
            {schedules.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Manual Item Trigger */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="일정을 수동으로 추가합니다."
            id="btn-add-schedule"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>일정 추가</span>
          </button>

          {/* Copy Plaintext List Button */}
          <button
            onClick={handleCopyText}
            disabled={schedules.length === 0}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer ${
              copied
                ? "bg-green-600 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
            }`}
            id="btn-copy-schedules"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>요약 텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Add Form Overlay/Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddSchedule} className="border-b border-slate-200 bg-slate-50/50 p-4 animate-slide-down">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">마감 기한</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 py-1.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">담당자</label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="예: 홍길동 대리, 김철수"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 py-1.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">수행 과제 / 액션 아이템</label>
              <input
                type="text"
                placeholder="예: 보고서 최종 송부"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              추가 완료
            </button>
          </div>
        </form>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-white">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ClipboardList className="h-10 w-10 text-slate-300 stroke-1 mb-2" />
            <p className="text-xs">회의록을 파싱하거나 일정을 직접 추가해 주세요.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs text-slate-800 font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">기한 (마감일)</th>
                <th className="px-4 py-2.5">담당자</th>
                <th className="px-4 py-2.5">수행 과제</th>
                <th className="px-4 py-2.5 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {schedules.map(item => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    
                    {/* Date Column */}
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-hidden focus:border-indigo-600 font-mono"
                        />
                      ) : (
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 rounded-md px-2 py-0.5 text-[11px] font-medium font-mono">
                          {item.date}
                        </span>
                      )}
                    </td>

                    {/* Assignee Column */}
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-hidden focus:border-indigo-600"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{item.assignee}</span>
                      )}
                    </td>

                    {/* Task Column */}
                    <td className="px-4 py-2.5 max-w-md truncate" title={item.originalText}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTask}
                          onChange={(e) => setEditTask(e.target.value)}
                          className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-hidden focus:border-indigo-600"
                        />
                      ) : (
                        <div>
                          <p className="text-slate-800 font-medium">{item.task}</p>
                          {item.originalText && item.originalText !== "[수동 등록 일정]" && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 italic">
                              원본: "{item.originalText}"
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                            title="저장"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                            title="취소"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="일정 수정"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="일정 삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Copy Guide Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500 leading-relaxed">
        <b>💡 복사 팁:</b> '요약 텍스트 복사'를 이용하면 아웃룩 일정표, 메모장, 또는 카카오톡/슬랙 등 협업 툴에 <b>`[마감일] 할일 - 담당자`</b> 포맷으로 한눈에 보고하기 용이한 줄바꿈 목록으로 즉시 변환되어 클립보드에 담깁니다.
      </div>

    </div>
  );
}
