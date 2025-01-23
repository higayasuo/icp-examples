# How it works
このドキュメントで、Expoアプリで、Internet Identityで認証し、ICPのBackendに接続する方法を学習します。
中身が結構難しいので、最初に自然言語で内容を理解し、その後、コードを解説します。

英語版は[こちら](how_it_works.md)です。

## Internet Identityとは

Internet Identityは、Internet Computer上のサービスを利用するためのアカウントシステムです。従来のGoogleアカウントやApple IDに相当するものですが、以下のメリットがあります：

- プラットフォーム企業による個人情報の収集・追跡がありません
- Web3.0時代に適した分散型のアカウントシステムです
- 生体認証(パスキー)による安全なログインが可能です

これにより、従来の中央集権的なアカウントシステムの問題点を解決し、より安全でプライバシーを重視したWeb3.0時代のアカウントサービスを実現しています。

Internet IdentityのFrontendは、[Webアプリ](https://identity.ic0.app/)として提供されています。

## ExpoでInternet Identityを使うときの工夫

### Internet IdentityはExpoで動作しない

- 動作しない理由:
  - Internet Identityは、window.postMessage()を使用して認証を行う
  - Expoではwindow.postMessage()が未サポート

#### 解決方法

認証処理をWeb Frontendに分離し、以下のフローで実装します：

1. Expoアプリ側での処理:
  - SignIdentityを生成（公開鍵・秘密鍵のペア）
  - Web Frontendを外部ブラウザで起動
  - 生成した公開鍵をWeb Frontendに渡す

2. Web Frontend側での処理:
  - Expoアプリから受け取った公開鍵を使用
  - Internet Identity認証を実行
  - 認証成功後、DelegationChainを生成
  - DelegationChainをExpoアプリにリダイレクトで返却

3. Expoアプリ側での認証完了処理:
  - SignIdentityとDelegationChainを組み合わせる
  - DelegationIdentityを生成して認証完了

#### DelegationChainの特徴
- ユーザーの公開鍵が含まれる
- 署名権限委譲の証明書が含まれる

#### 通信の仕組み
- 外部ブラウザとExpoアプリ間の通信はリダイレクトを使用
- 認証情報の転送はDelegationChainのみに限定（秘密鍵は転送しない）


### DelegationIdentityの構成と仕組み

DelegationIdentityは、アプリがトランザクションに署名するが、トランザクションの保有者はユーザーということを実現するための仕組みです。

- 構成要素:
  - SignIdentity: 秘密鍵を保持し、トランザクション署名機能を提供
  - DelegationChain: ユーザーからアプリへの署名権限委譲の証明書

#### トランザクション処理フロー

1. アプリ:
  - トランザクションに署名を実施
  - ICPにトランザクションを送信

2. ICPによるトランザクション検証プロセス:
  - DelegationChainの証明書の検証
  - DelegationChainから委譲先アプリの公開鍵を取得
  - アプリの公開鍵によるトランザクションの署名検証

3. トランザクション実行:
  - 全検証成功後、正当なユーザーの操作としてトランザクションを実行

### DelegationIdentityの保存

- 保存する要素:
  - SignIdentity: セキュアなストレージ（expo-secure-store）に保存
    - 理由: 秘密鍵を含む重要な情報を持つため
  - DelegationChain: 通常のストレージ（@react-native-async-storage/async-storage）に保存
    - 理由: 機密情報を含まないため

#### 再起動時のDelegationIdentity復元手順

1. ストレージからの読み込み:
  - セキュアなストレージからSignIdentityを読み込む
  - 通常のストレージからDelegationChainを読み込む

2. DelegationIdentityの生成:
  - 読み込んだSignIdentityとDelegationChainを組み合わせる
  - これによりDelegationIdentityを復元

### Backendに接続するActor

Backendに接続するActorは、DelegationIdentityを使用して以下のように動作します：

#### 処理の流れ

1. Actorの動作:
  - Backendのメソッド呼び出しを受け取る
  - DelegationIdentityを使用してトランザクションに署名
  - 署名済みトランザクションをICPに送信

2. ICPでの処理:
  - DelegationChainの証明書を検証
  - DelegationChainから委譲先アプリの公開鍵を取得
  - アプリの公開鍵でトランザクションの署名を検証
  - 検証成功後、ユーザーの操作としてトランザクションを実行

#### 重要なポイント

- アプリがトランザクションに署名するが、実行はユーザーの操作として処理される
- DelegationChainによって、アプリへの署名権限委譲が正当であることを証明

## コードで理解しよう - Native(iOS/Android)編

今まで説明してきた内容をコードで理解しましょう。

### Expoアプリの起動時

#### baseKeyのセットアップ
baseKeyとは、アプリ用のSignIdentityです。

```typescript
const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
  undefined,
);
```
baseKeyのためにReactのstateを宣言します。

```typescript
const storedBaseKey = await SecureStore.getItemAsync('baseKey');
```
セキュアなストレージから、baseKeyを読み込みます。

```typescript
if (storedBaseKey) {
  if (!baseKey) {
    console.log('Restoring baseKey');
    const key = Ed25519KeyIdentity.fromJSON(storedBaseKey);
    setBaseKey(key);
  }
} else {
  console.log('Generating new baseKey');
  const key = Ed25519KeyIdentity.generate();
  await SecureStore.setItemAsync('baseKey', JSON.stringify(key.toJSON()));
  setBaseKey(key);
}
```
ストレージにbaseKeyが存在し、Reactのstateとして、baseKeyが存在しない場合、
baseKeyをJSONから復元して、Reactのstateとして保存します。
Ed25519KeyIdentityは、SignIdentityの一種です。

ストレージにbaseKeyが存在しない場合、新しいEd25519KeyIdentityを生成し、
セキュアなストレージとReactのstateに保存します。
セキュアなストレージに保存するのは、SignIdentityの秘密鍵を保護するためです。

#### identityのセットアップ
identityとは、DelegationIdentityのことです。

```typescript
const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
  undefined,
);
```
identityのためにReactのstateを宣言します。

```typescript
const storedDelegation = await AsyncStorage.getItem('delegation');
```
通常ストレージから、delegationを読み込みます。

```typescript
if (!identity && storedBaseKey && storedDelegation) {
  const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
  const delegation = DelegationChain.fromJSON(storedDelegation);
  const identity = DelegationIdentity.fromDelegation(baseKey, delegation);

  if (isDelegationValid(delegation)) {
    console.log('Setting identity from baseKey and delegation');
    setIdentity(identity);
  } else {
    console.log('Invalid delegation chain, removing delegation');
    await AsyncStorage.removeItem('delegation');
  }
}

setIsReady(true);
```
少しコードが長いので、部分的にコードを見ていきましょう。

```typescript
if (!identity && storedBaseKey && storedDelegation) {
```
identityが存在する場合は、何もしません。
identityが存在しない場合は、保存されていたbaseKeyとdelegationから、identityを復元します。

```typescript
const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
const delegation = DelegationChain.fromJSON(storedDelegation);
const identity = DelegationIdentity.fromDelegation(baseKey, delegation);
```
baseKeyとdelegationをJSONから復元します。
identityをbaseKeyとdelegationから復元します。

```typescript
if (isDelegationValid(delegation)) {
  console.log('Setting identity from baseKey and delegation');
  setIdentity(identity);
} else {
  console.log('Invalid delegation chain, removing delegation');
  await AsyncStorage.removeItem('delegation');
}
```
delegationが有効な場合、identityをReactのstateとして保存します。
delegationが有効でない場合、delegationを通常ストレージから削除します。
delegationが有効でなくなる主な原因は、delegationの有効期限切れです。何も指定しない場合、有効期限は8時間です。

```typescript
const [isReady, setIsReady] = useState(false);
```
identityのセットアップが完了したかを示しているのがisReadyです。
isReadyのためにReactのstateを宣言します。

```typescript
setIsReady(true);
```
identityのセットアップの最後に、isReadyをtrueに更新します。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)

### Expoアプリでのログイン
Expoアプリのログイン時にすることは、Internet Identityに接続するWeb Frontendを外部ブラウザ経由で呼び出すことです。
このWeb Frontendを今後は、ii-integrationと呼ぶことにします。

```typescript
const redirectUri = createURL('/');

if (!baseKey) {
  throw new Error('No base key');
}

const pubkey = toHex(baseKey.getPublicKey().toDer());

const iiUri = getInternetIdentityURL();

const iiIntegrationURL = getCanisterURL(
  ENV_VARS.CANISTER_ID_II_INTEGRATION,
);
const url = new URL(iiIntegrationURL);

url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('pubkey', pubkey);
url.searchParams.set('ii_uri', iiUri);

await AsyncStorage.setItem('lastPath', pathname);
await WebBrowser.openBrowserAsync(url.toString());
```
長いコードなので、部分的に見ていきましょう。

#### redirectUriの作成
redirectUriとは、ii-integrationからExpoアプリにリダイレクトで戻ってくるためのURLです。

```typescript
import { ..., createURL } from 'expo-linking';
```
ExpoでカスタムURLを使う場合、createURLを使用して、カスタムURLを取得します。
開発時に、Expo Goを使用する場合、カスタムURLは特殊なものになります。
createURLは、開発時と本番ビルド時の違いを吸収してくれます。

```typescript
const redirectUri = createURL('/');
```
createURLを使用して、redirectUriを作成します。

#### pubkeyの作成
pubkeyとは、baseKeyの公開鍵です。

```typescript
if (!baseKey) {
  throw new Error('No base key');
}

const pubkey = toHex(baseKey.getPublicKey().toDer());
```
baseKeyが存在しない場合、エラーを返します。
baseKeyの公開鍵を取得し、toHexで、16進数の文字列に変換します。

#### iiUriの作成
iiUriとは、Internet IdentityのURLです。

```typescript
const iiUri = getInternetIdentityURL();
```
getInternetIdentityURLを使用して、iiUriを作成します。

```typescript
export const getInternetIdentityURL = (): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return 'https://identity.ic0.app';
  }

  const canisterId = ENV_VARS.CANISTER_ID_INTERNET_IDENTITY;

  if (isLocalhostSubdomainSupported()) {
    return getCanisterLocalhostSubdomainURL(canisterId);
  }

  return `https://${HOST_ADDRESS}:24943/?canisterId=${canisterId}`;
};
```
ENV_VARSは、dfx deploy時に作成される.envファイルをタイプセーフに扱うことができるようにしたものです。
dfx deploy時に、自動的に作成されます。標準では作成されないので、どのように作成するのかは、別のドキュメントで解説します。

DFX_NETWORKは、dfx deploy時に指定したネットワークです。icの場合、Internet IdentityのURLは、https://identity.ic0.appになります。
ic以外の時は、CANISTER_ID_INTERNET_IDENTITYを使用して、Internet IdentityのcanisterIdを取得します。
canisterIdは、canisterにつけられているIDです。canisterというのは、他のチェーンのスマートコントラクトだと理解しておくといいでしょう。

isLocalhostSubdomainSupported()は、ブラウザが、localhost subdomainをサポートしているかを返します。
localhost subdomainをサポートしている場合、URLは、http://<canisterId>.localhost:4943になります。
localhost subdomainをサポートしていない場合、URLは、https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>のようになります。

localhost subdomainをサポートしていない場合、PCからアクセスする場合は、http://localhost:4943/canisterId=<canisterId>も可能なのですが、https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>も同様に可能なので、話を単純化するために、https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>を使用します。

isLocalhostSubdomainSupported()は、すごく単純化すると、WebアプリがPCで動いていて、ブラウザがChromeの場合のみ、trueを返します。

Expoアプリで、PCのWebアプリ以外(ネイティブアプリ、スマホWebアプリ)は、https:でLocal Canisterにアクセスする必要があります。
しかし、ICPのLocal Canisterは、https:をサポートしていません。
そこで、Proxyを使用して、https:のリクエストをhttp:にフォワードします。
このプロジェクトでは、local-ssl-proxyを使います。package.jsonに下記のエントリを書いて実行しておきます。

```json
"ssl:ii": "local-ssl-proxy --source 24943 --target 4943 --key ./.mkcert/192.168.0.210-key.pem --cert ./.mkcert/192.168.0.210.pem"
```
targetがhttp:のポート番号、sourceがhttps:のポート番号です。mkcertを使って、ルート局をインストールしたり、x509の証明書を作ったりする必要もあるのですが、これについては別のドキュメントで説明します。

上記の設定で、https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>へのリクエストは、http://localhost:4943/canisterId=<canisterId>にフォワードされます。

このチュートリアルでは、24943のポート番号を使っていますが、好きなポート番号を使って構いません。

```typescript
export const isLocalhostSubdomainSupported = (): boolean => {
  if (!window?.location?.origin?.includes('localhost')) {
    return false;
  }

  const userAgent = window?.navigator?.userAgent?.toLowerCase() || '';

  if (userAgent.includes('chrome')) {
    return true;
  }

  return false;
};
```
isLocalhostSubdomainSupportedを詳しく見ていきましょう。
window?.location?.originにlocalhostが含まれていない場合、falseを返します。
これは、PCからアクセスしているWebアプリに限定することを意味します。

window?.navigator?.userAgent?.toLowerCase()で、ブラウザのユーザーエージェントを取得します。
userAgentにchromeが含まれている場合、trueを返します。
userAgentにchromeが含まれていない場合、falseを返します。

わかりやすく言い換えれば、PCのWebアプリで、ブラウザがChromeのときだけ、trueを返すことになります。

ExpoのWebアプリで、PCからLocal Canisterにアクセスするテストは、ChoromeとSafariだけで良いとするなら、これくらいの簡易実装もありでしょう。

#### urlの作成
このurlは、ii-integrationにアクセスするURLです。

```typescript
const iiIntegrationURL = getCanisterURL(
  ENV_VARS.CANISTER_ID_II_INTEGRATION,
);
const url = new URL(iiIntegrationURL);
```
getCanisterURLは、先ほどのgetInternetIdentityURLと非常によく似ていて、Internet Identity以外のCanisterにアクセスするためのURLを返します。

```typescript
export const getCanisterURL = (canisterId: string): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return `https://${canisterId}.ic0.app`;
  }

  if (isLocalhostSubdomainSupported()) {
    return getCanisterLocalhostSubdomainURL(canisterId);
  }

  return `https://${HOST_ADDRESS}:14943/?canisterId=${canisterId}`;
};
```
先ほどのgetInternetIdentityURLとかなり似ているので、細かい説明は省きますが、ポート番号がgetInternetIdentityURLのポート番号とは異なることは頭に入れておいてください。
これは、Internet Identityとそれを呼び出す側(ii-integration)のオリジンが異なっている必要があるためです。

#### クエリパラメータの設定
```typescript
url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('pubkey', pubkey);
url.searchParams.set('ii_uri', iiUri);
```
先ほど作成したurlに、redirect_uri、pubkey、ii_uriを設定します。

#### 現在ページのパスの保存
```typescript
import { usePathname, ... } from 'expo-router';

const pathname = usePathname();

await AsyncStorage.setItem('lastPath', pathname);
```
ログイン処理から戻ってきた時に、現在のページに戻れるように、lastPathとして、現在のページのパスを保存します。

#### ii-integrationの呼び出し
```typescript
await WebBrowser.openBrowserAsync(url.toString());
```
先ほどのurlを使って、ii-integrationを呼び出します。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)

### ii-integrationの起動時
```typescript
try {
  const { redirectUri, identity, iiUri } = parseParams();
  const authClient = await AuthClient.create({ identity });
  const loginButton = document.querySelector('#ii-login-button') as HTMLButtonElement;

  loginButton.addEventListener('click', async () => {
    renderError('');
    try {
      await authClient.login({
        identityProvider: iiUri,
        onSuccess: () => {
          try {
            const delegationIdentity = authClient.getIdentity() as DelegationIdentity;
            const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
            window.location.href = url;
          } catch (error) {
            renderError(formatError('delegation retrieval failed', error));
          }
        },
        onError: (error?: string) => {
          renderError(formatError('authentication rejected', error || 'Unknown error'));
        },
      });
    } catch (error) {
      renderError(formatError('login process failed', error));
    }
  });
} catch (error) {
  renderError(formatError('initialization failed', error));
}
```
コードが長いので、部分的にコードを見ていきましょう。

#### 前準備
```typescript
const { redirectUri, identity, iiUri } = parseParams();
```
parseParamsは、ii-integrationのURLから、redirectUri、identity、iiUriを取得します。

```typescript
interface ParsedParams {
  redirectUri: string;
  identity: SignIdentity;
  iiUri: string;
}

const parseParams = (): ParsedParams => {
  const url = new URL(window.location.href);
  const redirectUri = url.searchParams.get('redirect_uri');
  const pubKey = url.searchParams.get('pubkey');
  const iiUri = url.searchParams.get('ii_uri');

  if (!redirectUri || !pubKey || !iiUri) {
    const error = new Error('Missing redirect_uri, pubkey, or ii_uri in query string');
    renderError(error.message);
    throw error;
  }

  const identity = new PublicKeyOnlyIdentity(
    Ed25519PublicKey.fromDer(fromHex(pubKey)),
  );

  return { redirectUri, identity, iiUri };
}
```
URLから、redirectUri、pubkey、iiUriを取得します。

redirectUriは、ii-integrationからExpoアプリにリダイレクトで戻るためのURLです。

pubkeyは、ExpoアプリのbaseKeyの公開鍵です。

iiUriは、Internet IdentityのURLです。

```typescript
class PublicKeyOnlyIdentity extends SignIdentity {
  #publicKey: PublicKey;

  constructor(publicKey: PublicKey) {
    super();
    this.#publicKey = publicKey;
  }

  getPublicKey(): PublicKey {
    return this.#publicKey;
  }

  async sign(blob: ArrayBuffer): Promise<Signature> {
    throw new Error('Cannot sign with public key only identity');
  }
}
```
通常、SignIdentityは、公開鍵と秘密鍵を持っていますが、Internet Identityの認証で必要になるのは、getPublicKey()だけなので、このような簡易実装でも問題ありません。

```typescript
const authClient = await AuthClient.create({ identity });
```
identityを渡してAuthClientを作成します。
identityの公開鍵はExpoアプリのものなので、これにより、ユーザーが署名することをExpoアプリに委譲できるようになります。

```typescript
const loginButton = document.querySelector('#ii-login-button') as HTMLButtonElement;
```
ii-login-buttonというIDのボタンを取得します。

#### authClient.login()
```typescript
authClient.login({
  identityProvider: iiUri,
  onSuccess: () => {
    try {
      const delegationIdentity = authClient.getIdentity() as DelegationIdentity;
      const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
      window.location.href = url;
    } catch (error) {
      renderError(formatError('delegation retrieval failed', error));
    }
  },
  onError: (error?: string) => {
    renderError(formatError('authentication rejected', error || 'Unknown error'));
  },
});
```
identityProviderには、Internet IdentityのURLを渡します。
onSuccessは、認証が成功した場合に呼ばれる関数です。
onErrorは、認証が失敗した場合に呼ばれる関数です。

認証が成功すると、authClient.getIdentity()で、DelegationIdentityを取得できます。
buildRedirectURLWithDelegationは、DelegationIdentityを使って、redirectUriに委譲情報を付与したURLを作成します。
window.location.hrefに、そのURLを設定することで、Expoアプリにリダイレクトで戻ります。

```typescript
const buildRedirectURLWithDelegation = (redirectUri: string, delegationIdentity: DelegationIdentity): string => {
  const delegationString = JSON.stringify(
    delegationIdentity.getDelegation().toJSON()
  );
  const encodedDelegation = encodeURIComponent(delegationString);
  return `${redirectUri}?delegation=${encodedDelegation}`;
};
```
DelegationIdentity.getDelegation()で、DelegationChainを取得できます。
DelegationChainは、ユーザーの公開鍵と、ユーザーがExpoアプリに署名することを委譲した証明書を持っています。
DelegationChainは、セキュアな情報を持っていないので、リダイレクトでExpoアプリに渡すことができます。

これで、ii-integrationからExpoアプリにリダイレクトでDelegationIdentityを渡す仕組みが理解できましたね。

[ii-integrationのソースコード](../src/ii-integration/index.ts)

### ii-integrationからExpoアプリに戻ってきた時
#### URLの取得
```typescript
const url = useURL();
```
useURLは、Expoアプリのurlを取得するためのフックです。

#### delegationの取得
```typescript
const search = new URLSearchParams(url?.split('?')[1]);
const delegation = search.get('delegation');
```
urlから、delegationを取得します。

#### delegationからDelegationIdentityを作成
```typescript
if (delegation) {
  const chain = DelegationChain.fromJSON(JSON.parse(delegation));
  AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
  const id = DelegationIdentity.fromDelegation(baseKey, chain);
  setIdentity(id);
  console.log('set identity from delegation');
  WebBrowser.dismissBrowser();
  restorePreLoginScreen();
}
```
このhooksは、urlとbaseKeyが変化した時に呼び出されるため、常にURLにdelegationパラメータが含まれているとは限りません。
そのため、delegationパラメータがある時のみ後続の処理を行います。

JSON文字列から、chainとしてDelegationChainを復元し、保存します。
baseKeyとchainから、DelegationIdentityを作成し、setIdentityで保存します。

WebBrowser.dismissBrowser()で、ii-integrationを閉じます。

restorePreLoginScreen()で、ログイン前の画面に戻します。

```typescript
const restorePreLoginScreen = async () => {
  const path = await AsyncStorage.getItem('lastPath');
  if (path) {
    navigate(path);
    await AsyncStorage.removeItem('lastPath');
  } else {
    router.replace('/');
  }
};
```
AsyncStorageから、lastPathを取得します。
lastPathがある場合、そのパスに戻ります。
lastPathがない場合、router.replace('/')で、ルート画面に戻ります。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)

### バックエンドにアクセスする
バックエンドへのアクセスは、Actorを使って行います。
バックエンドがRustで実装されていたとしても、Actorを使ってタイプセーフにアクセスできます。

```typescript
const { identity, ... } = useAuth();

const backend = identity ? createBackend(identity) : undefined;
```
useAuthで、identityを取得します。
identityがある場合、createBackendで、Actorを作成します。
Actorは、identityを使って、トランザクション(Tx)に署名し、ICPにTxを送信します。

[index.tsxのソースコード](../src/expo-starter-frontend/app/(tabs)/index.tsx)

```typescript
return backend.whoami();
```
backend.whoami()で、ユーザーのPrincipalのテキスト表現を取得できます。

[LoggedIn.tsxのソースコード](../src/expo-starter-frontend/components/LoggedIn.tsx)

```rust
#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}
```
バックエンドのRustのコードです。
whoami()は、ユーザーのPrincipalのテキスト表現を返します。

[expo-starter-backendのソースコード](../src/expo-starter-backend/src/lib.rs)



