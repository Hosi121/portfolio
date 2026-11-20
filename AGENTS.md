# AGENTS.md

## 文書の扱い

- エージェント向けの指示と作業上の制約はこのファイルに集約する。
- READMEは人向けの概要と基本操作に絞る。作業報告や会話の経緯を追記せず、作業のたびにdocsや手順書を増やさない。
- 過去の参考サイト、制作方法、検証記録を今後の要件として引き継がない。現在の表示内容や実装の細部は、以下のソースで確認する。

## 編集先

- 日英のプロフィール・実績：`src/pages/index.astro` / `src/pages/en.html.astro`。内容の変更は両言語へ反映する。
- OSSの掲載データ：`src/data/selected-contributions.ts` / `src/data/additional-contributions.ts`。表示は `src/components/SelectedContributions.astro` / `src/components/ContributionGroup.astro`。
- 紹介文とPRのプレビュー：`src/components/HoverPreview.astro` と `src/lib/hover-preview.ts`。マウス・キーボード・タッチでの操作を維持する。
- 共通スタイルとフッター：`src/styles/portfolio.css` / `src/components/SiteFooter.astro`。装飾描画と実績の開閉補助は `public/garden.js`。
- 記事：`src/content/posts/*.mdoc`、画像：`src/assets/posts/`。記事のスキーマは `src/content.config.ts`、下書きの除外と並び順は `src/lib/posts.ts`。
- ローカルエディタ：`src/editor/`。文字数・読了時間は `src/lib/reading-stats.mjs` / `src/lib/article-stats.mjs` を編集画面と記事ページで共用する。

## 開発と確認

- Node.js 24とnpmを使用する。依存の導入は `npm ci`。コマンドの定義は `package.json`。
- `npm run dev` で開発サーバーを起動する。エディタは `/blog/new`。終了は `npx astro dev stop`、状態・ログの確認は `npx astro dev status` / `npx astro dev logs`。
- `npm run build` / `npm run preview` で公開用ビルドを確認する。開発サーバーとビルドは同時実行しない。
- ページ・エディタの挙動は `npm test`、文字数・読了時間は `npm run test:stats`、公開範囲とURLは `npm run test:build` で、変更に関わるものを確認する。
- 表示・操作を変えた場合は、日英、狭い画面、キーボード・タッチ、JavaScript無効時、動きを減らす設定、見出しURL、印刷のうち変更に関わる条件を確認する。
- 文書のみの変更は差分と参照の整合を確認する。不要なサーバー起動やビルドは行わない。

## 守る条件

- `astro.config.mjs` のベースパス（開発時 `/`、公開時 `/portfolio/`）と、`scripts/finalize-build.mjs` による既存URL `/portfolio/en.html` の維持を壊さない。公開設定は `.github/workflows/deploy.yml`。
- 編集UI、新規作成ページ、保存API、表示サンプルはローカル開発専用。公開ビルドに含めない。
- 新規記事は下書きとし、本番の一覧・本文・RSS・サイトマップから除外する。記事の日付は予約公開の条件にしない。未公開の原稿を勝手にコミット・pushしない。
- エディタの一時保存、競合検知、未対応のMarkdoc構文に対する編集停止を維持し、記事を上書き・変質させない。自動リロードで編集中の画面を切り替えない。
- 記事画像は挿入時点で保存されるため、本文で未使用に見えても対応を確認せず削除しない。
- PRの状態・スター数・被引用数は静的な掲載値。更新する場合は根拠を確認し、閲覧時のAPI通信は追加しない。
- ESP-DL #332は[メンテナーの内部GitLabでのマージ報告](https://github.com/espressif/esp-dl/pull/332#issuecomment-5658820520)に基づくマージ済み扱い。GitHubのclosed表示だけで分類を変えない。
