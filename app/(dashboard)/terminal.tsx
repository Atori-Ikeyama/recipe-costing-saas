'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export function Terminal() {
  const [terminalStep, setTerminalStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const terminalSteps = [
    'レシピ「季節のタルト」を同期中...',
    '仕入価格を更新: 1kg あたり ¥1,280 → ¥1,210',
    '歩留まり 92% を反映して原価を再計算',
    '粗利率 64.2% | 売価 ¥1,480',
    'ダッシュボードを最新状態に更新 ✅',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerminalStep((prev) =>
        prev < terminalSteps.length - 1 ? prev + 1 : prev
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [terminalStep]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-[#E8E8E6] bg-white/95 p-6 font-mono text-sm text-[#2B2B2B] shadow-[0_20px_60px_-30px_rgba(232,90,79,0.35)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#E8E8E6] to-transparent" />
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E85A4F]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4F9D69]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E8B04F]/80" />
        </div>
        <button
          onClick={copyToClipboard}
          className="rounded-full border border-[#E8E8E6] bg-[#FAFAF9] p-2 text-[#2B2B2B]/60 transition hover:border-[#E85A4F]/40 hover:text-[#E85A4F]"
          aria-label="クリップボードにコピー"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className="space-y-3">
        {terminalSteps.map((step, index) => (
          <div
            key={index}
            className={`${index > terminalStep ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100'} flex items-start gap-3 text-[#2B2B2B]/80 transition-all duration-300`}
          >
            <span className="mt-0.5 text-[#E85A4F]">$</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E8E8E6] to-transparent" />
    </div>
  );
}
