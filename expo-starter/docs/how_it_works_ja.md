# How it works

英語版は[こちら](how_it_works.md)です。

## Internet Identityとは

Internet Identityは、Internet Computer上のサービスを利用するためのアカウントシステムです。従来のGoogleアカウントやApple IDに相当するものですが、以下のメリットがあります：

- プラットフォーム企業による個人情報の収集・追跡がありません
- Web3.0時代に適した分散型のアカウントシステムです
- 生体認証(パスキー)による安全なログインが可能です

これにより、従来の中央集権的なアカウントシステムの問題点を解決し、より安全でプライバシーを重視したWeb3.0時代のアカウントサービスを実現しています。

Internet IdentityのFrontendは、[Webアプリ](https://identity.ic0.app/)として提供されています。


## ExpoでInternet Identityを使うときの問題点

### window.postMessage()がサポートされていない

TypeScriptでInternet Identityを使うために、[公式のライブラリ: `@dfinity/auth-client`](https://github.com/dfinity/agent-js/tree/main/packages/auth-client)が提供されています。

しかし、`auth-client`は、Expoでは動作しません。`auth-client`は、`window.postMessage()`を使用して、Internet IdentityのFrontendとやりとりしますが、Expoでは`window.postMessage()`がサポートされていないためです。Expoで利用できる`WebView`も同様の理由で動作しません。

これに対する対策は、`auth-client`を使用するWeb Frontendを作成し、Expoから外部ブラウザ経由で呼び出します。Web Frontendでは、認証成功後、リダイレクトで認証されたDelegationIdentityをExpoアプリに返します。

### DelegationIdentityとは

`DelegationIdentity`は、アプリで署名する機能を持った`SignIdentity`と、ユーザーが署名する機能をアプリに委譲する`DelegationChain`で構成されています。
`DelegationChain`は、ユーザーがアプリに署名する機能を委譲したことを証明する、証明書を持っています。

ICPのトランザクション(Tx)は、アプリが署名をします。ICPはTxの署名が正しいことを確認した後、`DelegationChain`の証明書を検証します。
検証が成功したら、Txの真の実行者は、ユーザーとして認識されます。

`DelegationIdentity`に含まれる、`SignIdentity`は、署名をするための秘密鍵を持っています。そのため、`DelegationIdentity`自体をリダイレクトで、Expoアプリに返すことは、セキュリティ上やるべきではありません。

### セキュアにDelegationIdentityを扱うには

セキュアにDelegationIdentityを扱うには、最初に、Expoアプリで`SignIdentity`を作成します。`SignIdentity`から、公開鍵を取り出し、`auth-client`を使用するWeb Frontendに渡します。

Web Frontendでは、公開鍵から、署名機能を持たない`SignIdentity`を作成し、`auth-client`に渡します。
`Internet Identity`で認証が成功すると、`auth-client`から、署名機能を持たない`DelegationIdentity`を取得することができます。
そこから、`DelegationChain`を取り出し、リダイレクトで、Expoアプリに返します。
`DelegationChain`は公開しても良い情報しか持っていないので、リダイレクトで返しても、セキュリティ上問題ありません。

Expoアプリでは、リダイレクトで受け取った`DelegationChain`と自分で作成した`SignIdentity`を組み合わせて、`DelegationIdentity`を作成します。
これで、署名機能を持った`DelegationIdentity`をセキュアに作成することができました。

### DelegationIdentityの保存

Expoアプリでは、`SignIdentity`をセキュアなストレージ(`expo-secure-store`など)に保存します。
`DelegationChain`は、通常のストレージ(`@react-native-async-storage/async-storage`など)に保存します。
アプリを再起動したときに、`SignIdentity`と`DelegationChain`を読み込み、`DelegationIdentity`を作成すると良いでしょう。

