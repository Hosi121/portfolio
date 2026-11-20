# Portfolio

日英のポートフォリオとブログ。Astroで静的生成し、GitHub Pagesで公開しています。

## 記事を書く

Node.js 24を使用します。

```sh
npm ci
npm run dev
```

http://localhost:4321/blog/new を開いて記事を書きます。既存の記事はブログ一覧から開いて「編集」を選びます。記事は「保存」またはCtrl/Cmd+Sで保存します。

終了するときは、記事を保存してから `npx astro dev stop` を実行します。ブラウザを閉じてもサーバーは停止しません。

記事の保存先は `src/content/posts/`、画像は `src/assets/posts/` です。保存だけでは公開されません。

## 公開する

記事の下書き設定をオフにして保存し、記事と画像をコミットしてmainへpushすると公開されます。下書きはサイトに出ませんが、pushした原稿は公開リポジトリで読めます。

公開前に手元で確認する場合は、エディタを停止してから次を実行します。

```sh
npm run build
npm run preview
```

表示先は http://localhost:4321/portfolio/ です。
