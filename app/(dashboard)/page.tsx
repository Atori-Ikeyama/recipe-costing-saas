import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  PieChart,
  Layers,
  Users,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { Terminal } from './terminal';

const stats = [
  {
    value: '92%',
    label: 'リアルタイム原価反映',
    caption: '歩留まり・仕入価格を自動同期',
  },
  {
    value: '45分',
    label: '月次作業の削減時間',
    caption: '1レシピあたりの平均作業時間',
  },
  {
    value: '＋14%',
    label: '粗利率の改善事例',
    caption: '小規模厨房での導入結果',
  },
];

const features = [
  {
    icon: PieChart,
    title: 'レシピ原価を瞬時に把握',
    description:
      '歩留まりや仕入価格を更新すると、粗利率・売価・利益額がすぐに反映。数字を見ながらレシピ調整ができます。',
  },
  {
    icon: Layers,
    title: '材料データベースを一元管理',
    description:
      '材料単価・購入単位・換算ルールをまとめて管理。レシピに使えば自動で原価に反映されます。',
  },
  {
    icon: Users,
    title: '小さなチームにも柔軟な権限',
    description:
      'オーナー・マネージャー・スタッフで表示範囲や操作権限をコントロール。安心して共有できます。',
  },
  {
    icon: BellRing,
    title: '安心のアラートとレポート',
    description:
      '粗利率が閾値を下回るとアラートを通知。週次レポートで変化を振り返り、数字の感度を高めます。',
  },
];

const workflow = [
  {
    step: 'STEP 01',
    title: 'レシピと材料を取り込む',
    body: '既存のスプレッドシートやメモをアップロード。歩留まりや単価も一緒に整理できます。',
  },
  {
    step: 'STEP 02',
    title: '原価の変化をチェック',
    body: 'レシピ構成を調整すると粗利率が即座に反映。材料の置き換えシミュレーションも自由自在です。',
  },
  {
    step: 'STEP 03',
    title: '数字をチームで共有',
    body: 'ダッシュボードとレポートを共有し、原価を共有する文化を育てます。',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#2B2B2B] font-['Noto_Sans_JP','Zen_Kaku_Gothic_New',sans-serif]">
      <section className="px-6 pt-24 pb-20 sm:pb-28">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E6] bg-white px-4 py-2 text-xs font-medium tracking-[0.3em] text-[#4F9D69]">
              <Sparkles className="h-4 w-4" />
              RESICOSU
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl leading-tight sm:text-5xl sm:leading-tight lg:text-6xl">
                料理の感性を守りながら、
                <br className="hidden sm:block" />
                原価の数字に強くなる。
              </h1>
              <p className="text-base leading-relaxed text-[#2B2B2B]/75 sm:text-lg lg:text-xl">
                「レシコス」は、小さなレストランや個人シェフのための原価ダッシュボード。
                感覚で育てたレシピを、数字の裏づけと安心で支えます。
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[#E85A4F] px-8 text-base font-medium text-white shadow-[0_15px_40px_-20px_rgba(232,90,79,0.7)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#F16F61]"
              >
                <Link href="/sign-up">
                  無料で始める
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-[#4F9D69] bg-transparent px-8 text-base font-medium text-[#4F9D69] transition hover:bg-[#4F9D69]/10"
              >
                <Link href="/pricing">
                  料金プランを見る
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 border-t border-[#E8E8E6] pt-8 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <p className="text-3xl font-semibold text-[#2B2B2B] sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-[#2B2B2B]/70">
                    {stat.label}
                  </p>
                  <p className="text-xs text-[#2B2B2B]/50">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[#E85A4F]/15 blur-3xl" />
            <div className="relative rounded-[32px] bg-white p-4">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl space-y-6 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            原価の透明性が、厨房に余白を生む。
          </h2>
          <p className="mx-auto max-w-2xl text-base text-[#2B2B2B]/70 sm:text-lg">
            レシコスは、数字に寄り添うためのUIを徹底的に磨きました。
            触れるたびに、料理人の勘と計算が心地よくつながります。
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex h-full flex-col gap-4 rounded-3xl bg-white p-8 transition-all duration-300 hover:-translate-y-1"
            >
              <feature.icon className="h-8 w-8 text-[#E85A4F]" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#2B2B2B]/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-14 rounded-[40px] bg-white px-8 py-14 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              導入から運用まで、3つのステップ。
            </h2>
            <p className="text-base text-[#2B2B2B]/70">
              専門知識がなくても大丈夫。レシコスが原価管理の最初の一歩から伴走します。
            </p>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#4F9D69] px-8 text-base font-medium text-white transition hover:bg-[#64B17D]"
            >
              <Link href="/sign-in">デモで体験する</Link>
            </Button>
          </div>
          <div className="grid gap-10">
            {workflow.map((item, index) => (
              <div
                key={item.step}
                className="relative rounded-3xl bg-[#FAFAF9] p-8"
              >
                <div className="absolute -top-5 left-6 flex h-10 items-center rounded-full border border-[#E8E8E6] bg-white px-4 text-xs font-semibold tracking-[0.3em] text-[#E85A4F]">
                  {item.step}
                </div>
                <div className="mt-4 space-y-3">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#2B2B2B]/70">
                    {item.body}
                  </p>
                </div>
                {index < workflow.length - 1 ? (
                  <div className="mt-8 h-px w-full bg-[#E8E8E6]" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-[40px] bg-white px-10 py-16 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            無料プランから、安心して始められる。
          </h2>
          <p className="mt-4 text-base text-[#2B2B2B]/70 sm:text-lg">
            レシコスはいつでも無料で使えます。必要になったら、Pro や Team へのアップグレードで
            さらに充実したサポートを。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#E85A4F] px-8 text-base font-medium text-white transition hover:bg-[#F16F61]"
            >
              <Link href="/pricing">
                料金プランを詳しく見る
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-[#2B2B2B]/20 bg-[#FAFAF9] px-8 text-base font-medium text-[#2B2B2B] transition hover:border-[#E85A4F]/40 hover:text-[#E85A4F]"
            >
              <Link href="/sign-up">アカウントを作成する</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-[#2B2B2B]/60">
            レシコスは、すべての料理人が“原価を感じる力”を持てるように。無料でも続けられる設計で、文化を育てています。
            有料プランは、その文化を支えるための応援のかたちです。
          </p>
        </div>
      </section>
    </main>
  );
}
