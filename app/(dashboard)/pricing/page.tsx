export default function PricingPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#2B2B2B]">
      <section className="py-20 px-6 font-['Noto_Sans_JP','Zen_Kaku_Gothic_New',sans-serif]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-semibold">
            無料で、原価の見える化を始めよう。
          </h2>
          <p className="text-base md:text-lg text-[#2B2B2B]/80">
            小さな一歩が、料理をもっと自由にする。
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <article className="flex flex-col gap-6 rounded-3xl border border-transparent bg-white/90 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
            <header className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-widest text-[#4F9D69]">
                Free
              </p>
              <h3 className="text-2xl font-semibold">
                ¥0
                <span className="text-base font-normal text-[#2B2B2B]/70">
                  {' '}
                  /月
                </span>
              </h3>
              <p className="text-sm leading-relaxed text-[#2B2B2B]/70">
                「まずは気軽に。原価の感覚をつかむための無料プラン。」
              </p>
            </header>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>レシピ登録：10件まで</li>
              <li>材料登録：30件まで</li>
              <li>チーム招待：1人まで</li>
              <li>原価計算・グラフ表示：✅</li>
              <li>データ保存：✅</li>
              <li>広告なし</li>
            </ul>
            <button className="mt-auto inline-flex items-center justify-center rounded-2xl bg-[#E85A4F] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#F16F61]">
              このプランを選ぶ
            </button>
          </article>

          <article className="relative flex flex-col gap-6 rounded-3xl border border-[#E85A4F] bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl md:-mt-4 before:absolute before:-inset-1 before:-z-10 before:rounded-3xl before:bg-[#E85A4F]/10 before:blur-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#E85A4F] px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow-md">
              Recommended
            </div>
            <header className="space-y-2 pt-4">
              <p className="text-sm font-medium uppercase tracking-widest text-[#E85A4F]">
                Pro
              </p>
              <h3 className="text-2xl font-semibold">
                ¥300
                <span className="text-base font-normal text-[#2B2B2B]/70">
                  {' '}
                  /月
                </span>
              </h3>
              <p className="text-sm leading-relaxed text-[#2B2B2B]/70">
                「お店のレシピをすべて見える化。小さな厨房に、数字の安心を。」
              </p>
            </header>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>レシピ・材料登録：無制限</li>
              <li>チーム招待：3人まで</li>
              <li>グラフ・利益率分析：✅</li>
              <li>CSVエクスポート：✅</li>
            </ul>
            <button className="mt-auto inline-flex items-center justify-center rounded-2xl bg-[#E85A4F] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#F16F61]">
              このプランを選ぶ
            </button>
          </article>

          <article className="flex flex-col gap-6 rounded-3xl border border-transparent bg-white/90 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
            <header className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-widest text-[#4F9D69]">
                Team
              </p>
              <h3 className="text-2xl font-semibold">
                ¥1,000
                <span className="text-base font-normal text-[#2B2B2B]/70">
                  {' '}
                  /月
                </span>
              </h3>
              <p className="text-sm leading-relaxed text-[#2B2B2B]/70">
                「チームで共有し、原価を“見える文化”に。」
              </p>
            </header>
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>無制限登録</li>
              <li>チーム招待：10人まで</li>
              <li>管理者権限・エクスポート：✅</li>
              <li>優先サポート：✅</li>
            </ul>
            <button className="mt-auto inline-flex items-center justify-center rounded-2xl bg-[#E85A4F] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#F16F61]">
              このプランを選ぶ
            </button>
          </article>
        </div>

        <div className="mt-16 mx-auto max-w-3xl space-y-3 text-center text-sm leading-relaxed text-[#2B2B2B]/75">
          <p>
            レシコスは、すべての料理人が“原価を感じる力”を持てるように。<br />
            無料でも、ずっと使い続けられる設計にしています。<br />
            有料プランは、この文化を支えるための応援のかたちです。
          </p>
        </div>
      </section>
    </main>
  );
}
