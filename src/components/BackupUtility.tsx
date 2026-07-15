import React from "react";
import { Download, Upload, Trash2 } from "lucide-react";

interface BackupUtilityProps {
  meetingText: string;
  teamMembers: string[];
  onRestore: (data: { meetingText: string; teamMembers?: string[] }) => void;
  onClearAll: () => void;
}

export default function BackupUtility({
  meetingText,
  teamMembers,
  onRestore,
  onClearAll
}: BackupUtilityProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const backupData = {
        app: "DailySync",
        exportedAt: new Date().toISOString(),
        reportText: "",
        meetingText,
        teamMembers
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DailySync_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Backup failed", e);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && parsed.app === "DailySync") {
          onRestore({
            meetingText: parsed.meetingText || "",
            teamMembers: parsed.teamMembers || []
          });
        } else {
          alert("올바른 DailySync 백업 파일이 아닙니다.");
        }
      } catch (err) {
        alert("백업 파일을 분석하는 데 실패했습니다. 올바른 JSON 포맷인지 확인해 주세요.");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">💾 로컬 데이터 백업:</span> 브라우저 청소 시 손실을 막기 위해 텍스트 파일로 저장하세요.
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200 transition shadow-xs cursor-pointer"
          title="현재 기입된 내용을 파일로 백업합니다."
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>백업 파일 받기</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-zinc-100 hover:text-indigo-600 hover:border-indigo-200 transition shadow-xs cursor-pointer"
          title="이전에 백업된 파일로부터 복구합니다."
        >
          <Upload className="h-3.5 w-3.5 text-slate-500" />
          <span>백업 불러오기</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition shadow-xs cursor-pointer"
          title="모든 입력 및 캐시 데이터를 지우고 초기화합니다."
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
          <span>전체 초기화</span>
        </button>
      </div>
    </div>
  );
}
