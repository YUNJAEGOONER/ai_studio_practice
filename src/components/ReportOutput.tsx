import React from "react";
import { Copy, Check, FileText, LayoutGrid, Edit3, Eye } from "lucide-react";
import { REPORT_TEMPLATES } from "../utils/parser";

interface ReportOutputProps {
  formattedText: string;
  setFormattedText: (text: string) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  onRefresh: () => void;
}

export default function ReportOutput({
  formattedText,
  setFormattedText,
  selectedTemplateId,
  setSelectedTemplateId,
  onRefresh
}: ReportOutputProps) {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const selectedTemplate = REPORT_TEMPLATES.find(t => t.id === selectedTemplateId) || REPORT_TEMPLATES[0];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Output Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-700" />
          <h3 className="font-display font-semibold text-sm text-slate-900">가공된 일일 보고서 결과</h3>
        </div>
        
        {/* Template Selector & Edit Switcher */}
        <div className="flex items-center gap-2">
          {/* Template select dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
            <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
              title="보고서의 출력 레이아웃 양식을 전환합니다."
            >
              {REPORT_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Toggle manual edits */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              isEditing 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
            title="변환된 결과물을 수동으로 추가 편집하고 싶을 때 사용하세요."
          >
            {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            <span>{isEditing ? "뷰어로 보기" : "직접 수정"}</span>
          </button>
        </div>
      </div>

      {/* Template Description Banner */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700">양식 가이드:</span> {selectedTemplate.description}
      </div>

      {/* Display Text Area / Preview */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50/10">
        {isEditing ? (
          <textarea
            value={formattedText}
            onChange={(e) => setFormattedText(e.target.value)}
            className="w-full h-full min-h-[300px] p-3 rounded-lg border border-slate-200 bg-white font-mono text-xs leading-relaxed focus:border-indigo-600 focus:outline-hidden resize-none"
            placeholder="여기에 직접 수정하여 팀장님 보고 문구를 다듬어보세요."
          />
        ) : (
          <div className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-4 leading-relaxed whitespace-pre-wrap select-all font-mono">
            {formattedText || "왼쪽에 업무 내용을 입력한 후 [변환하기] 버튼을 눌러주세요."}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-[11px] text-slate-500">
          Markdown 형식이므로 노션, 메신저 등에 복사-붙여넣기 시 서식이 유지됩니다.
        </span>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!formattedText}
            className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition duration-200 ${
              copied
                ? "bg-green-600 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-97 disabled:opacity-40 disabled:pointer-events-none"
            }`}
            id="btn-copy-report"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 animate-scale-up" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>클립보드 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
