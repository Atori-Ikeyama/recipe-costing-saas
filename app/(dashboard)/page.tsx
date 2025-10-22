import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LineChart, Package, Users } from 'lucide-react';
import { Terminal } from './terminal';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                厨房データを利益に変える
                <span className="block text-orange-500">
                  Recipe Costing SaaS
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                仕入れ価格・歩留まり・売価・粗利率をリアルタイムに可視化し、ダッシュボードと連携した原価管理を実現。
                現場の勘と経験に頼らず、数字で判断できるチームへ。
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full"
                >
                  <Link href="/sign-up">
                    無料で始める
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <LineChart className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  原価ダッシュボード
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  レシピ単位の原価・粗利率・売価をひと目で確認。
                  ダッシュボードの視点をそのまま現場に届けます。
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Package className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  仕入と在庫の一元管理
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  仕入れ単価・購入単位・歩留まりを自動換算。
                  食材コストの変動を即座に反映し、利益率を守ります。
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  チームで共有できる権限設計
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  オーナー・マネージャー・スタッフごとに権限を制御。
                  最新の原価情報をチーム全体でシームレスに共有できます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                いま、台所の数字をアップデートしよう
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                デモデータでダッシュボードを触りながら、原価シミュレーションの流れを体験できます。
                現場のオペレーションに合わせて、すぐに導入を開始しましょう。
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg rounded-full"
              >
                <Link href="/sign-in">
                  デモにログイン
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
