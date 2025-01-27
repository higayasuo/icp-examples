# セットアップ手順

## 必要な環境
- Node.jsバージョン18以上が必要です

## Expo Goのインストール
お使いの端末に「Expo Go」アプリをインストールしてください：
- iPhone/iPadをお使いの方：App Storeからインストール
- Androidをお使いの方：Google Play Storeからインストール

## mkcertのインストール

mkcertのインストール方法と設定手順を説明します。

### macOSでのインストール
```bash
brew install mkcert
brew install nss
```

### ルート認証局の設定
```bash
mkcert -install
```

### 証明書の場所確認
```bash
mkcert -CAROOT
```

### iOSでの証明書設定

- rootCA.pemファイルをiOSデバイスに送信
- 設定アプリで「プロファイルがダウンロードされました」からインストール
- 設定→一般→情報→証明書信頼設定でmkcert証明書を有効化

### Androidでの証明書設定

- 証明書ファイルをデバイスに転送
- 設定→セキュリティ→その他→ストレージからインストール
- CA証明書として選択してインストール

**重要な注意点**
- Firefoxを使用する場合は必ずnssのインストールが必要
- 作成された鍵ファイルは絶対に共有しない
- 管理者権限が必要な場合あり

## tigedのインストール
```bash
npm install -g tiged
```

## プロジェクトのダウンロード
以下のコマンドでプロジェクトをダウンロードし、プロジェクトフォルダに移動します：
```bash
tiged higayasuo/icp-examples/expo-starter expo-starter
cd expo-starter
```
## RustとICPの開発ツールのインストール

### インストールの実行
以下のコマンドを実行してインストールします：
```bash
./scripts/setup.sh
```

### インストール確認
インストールが正常に完了したかを確認するため、以下のコマンドを実行します：
```bash
rustc -V
dfx -V
```

両方のコマンドがバージョン情報を表示すれば、インストールは成功です。

**注意点**：
- バージョン確認時は「V」は必ず大文字で入力してください
- バージョン情報が表示されない場合は、インストールが正常に完了していない可能性があります

## Frontend, Internet Identity, ii-integrationのセットアップ
下記のコマンドでセットアップを行います：
```bash
npm run setup
```

## 静的IPアドレスの設定
スマホから、PCの開発サーバーにアクセスするには、IPアドレスを使います。
PCを再起動するたびに、IPアドレスが変わると不便なので、IPアドレスを静的に設定します。
macOSでIPアドレスを静的に設定する方法は以下の通りです：

1. アップルメニューから「システム設定」を開きます

2. サイドバーで「ネットワーク」をクリックします

3. 使用中のネットワーク接続（Wi-FiまたはEthernet）を選択し、「詳細」をクリックします

4. 「TCP/IP」タブを開きます

5. 「IPv4を構成」のプルダウンメニューから「DHCPサーバを使用(アドレスは手入力)」を選択し、以下の情報を入力します：
- IPアドレス
  - DHCPの動的割り当てと被りにくい、192.168.0.200-192.168.0.254の範囲で設定するのがおすすめです。例えば、192.168.0.210を使うといいでしょう。

## 静的IPアドレス用SSL証明書の作成
SSL証明書の作成手順を説明します

### 証明書作成の準備
```bash
mkdir .mkcert
cd .mkcert
```
これらのコマンドは下記のことをしています：
1. 証明書を保存するための専用ディレクトリを作成します
2. 作成したディレクトリに移動します

### SSL証明書の生成
```bash
mkcert [静的IPアドレス]
```
このコマンドを実行すると、以下のファイルが生成されます：
- [静的IPアドレス].pem - SSLサーバー証明書
- [静的IPアドレス]-key.pem - 秘密鍵

### 作業終了
```bash
cd ..
```
証明書の作成が完了したら、元のディレクトリに戻ります。

**重要な注意点**
- 生成された秘密鍵は絶対に共有しないでください
- 証明書の有効期間は27か月（約2年3か月）です
- 証明書は必ず安全な場所に保管してください

## local-ssl-proxyの設定
package.jsonのssl:canisters, ssl:ii, ssl:webのエントリを、自分で設定した固定IPアドレスに変更します。

### package.jsonへの設定追加
```json
{
  "scripts": {
    "ssl:canisters": "local-ssl-proxy --key ./.mkcert/[静的IPアドレス]-key.pem --cert ./.mkcert/[静的IPアドレス].pem --source 14943 --target 4943",
    "ssl:ii": "local-ssl-proxy --key ./.mkcert/[静的IPアドレス]-key.pem --cert ./.mkcert/[静的IPアドレス].pem --source 24943 --target 4943",
    "ssl:web": "local-ssl-proxy --key ./.mkcert/[静的IPアドレス]-key.pem --cert ./.mkcert/[静的IPアドレス].pem --source 18081 --target 8081"
  }
}
```

各設定の内容は下記のことをしています：
- `--key`：秘密鍵ファイルのパスを指定します
- `--cert`：証明書ファイルのパスを指定します
- `--source`：HTTPSでアクセスする際のポート番号です
- `--target`：実際のアプリケーションが動作しているポート番号です

**重要な注意点**
- [静的IPアドレス]は、先ほど設定した静的IPアドレスに置き換えてください
- 証明書と秘密鍵のファイルパスは、mkcertで生成したファイルの場所と一致させてください

## dfx:start
### 開発サーバーの起動
新しいターミナルを立ち上げて、以下のコマンドを実行します：
```bash
npm run dfx:start
```
このコマンドは下記のことをしています：
1. ローカルreplicaを開始します
2. デフォルトで4943番ポートでサーバーが起動します

### 開発サーバーの停止方法
開発サーバーを停止するには、以下のいずれかの方法を使用します：
- 起動中のターミナルでCtrl+Cを押します
- 別のターミナルで`dfx stop`コマンドを実行します

## dfx:deploy
internet-identity, ii-integration, frontend, backendのキャニスターをデプロイするには、
新しいターミナルを立ち上げて、以下のコマンドを実行します：

```bash
npm run dfx:deploy
```
このコマンドは下記のことをしています：
1. 全てのキャニスター（internet-identity, ii-integration, frontend, backend）をビルドします
2. ビルドしたキャニスターをローカルreplicaにインストールします

**重要な注意点**
- デプロイ前にdfx:startが実行されている必要があります
- デプロイには数分かかる場合があります

## local-ssl-proxyの起動
local-ssl-proxyの起動方法を説明します

### 起動コマンド
```bash
npm run ssl:canisters
npm run ssl:ii
npm run ssl:web
```
これらのコマンドは下記のことをしています：
1. ssl:canistersはキャニスター用のHTTPS接続を提供します（14943→4943）
2. ssl:iiはInternet Identity用のHTTPS接続を提供します（24943→4943）
3. ssl:webはWebフロントエンド用のHTTPS接続を提供します（18081→8081）

**重要な注意点**
- 各コマンドは必ず別々の新しいターミナルで実行してください
- コマンドを実行する前に、対象のポートが使用されていないことを確認してください
- 証明書のパスが正しく設定されていることを確認してください
- 起動後はCtrl+Cで個別に停止できます


## frontend:start
Expo開発サーバーの起動方法を説明します

### 基本的な起動コマンド
```bash
npm run frontend:start
```
このコマンドを実行すると下記のことが行われます：
1. Expoの開発者サーバーが起動します
2. QRコードが表示されます
3. 操作用のメニューが表示されます

### 主な操作方法
- `w`キー：Webブラウザでアプリを起動します

### スマートフォンでの実行方法
1. Expo Goアプリをインストールします
2. iOSの場合：カメラアプリでQRコードを読み取ります
3. Androidの場合：Expo GoアプリでQRコードを読み取ります

**重要な注意点**
- PCとスマートフォンは同じWi-Fiに接続してください
- 開発サーバーの停止はCtrl+Cで行います

## セットアップ完了

これで、ExpoアプリでInternet Identityを使って、ICPのBackendに接続するためのセットアップは完了です。

