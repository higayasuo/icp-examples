# How it works
このドキュメントで、Expoアプリで、`Internet Identity`で認証し、`ICP`の`Backend`に接続する方法を学習します。
中身が結構難しいので、最初に自然言語で内容を理解し、その後、コードを解説します。

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

これに対する対策は、`auth-client`を使用するWeb Frontendを作成し、Expoから外部ブラウザ経由で呼び出します。Web Frontendでは、認証成功後、リダイレクトで認証情報であるDelegationIdentityをExpoアプリに返します。

### DelegationIdentityとは

`DelegationIdentity`は、アプリで署名する機能を持った`SignIdentity`と、ユーザーが署名する機能をアプリに委譲する`DelegationChain`で構成されています。
`DelegationChain`は、ユーザーがアプリに署名する機能を委譲したことを証明する証明書を持っています。

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
アプリを再起動したときに、`SignIdentity`と`DelegationChain`を読み込み、`DelegationIdentity`を復元すると良いでしょう。

### Backendに接続するActor

`Backend`に接続するActorを作成するため、`DelegationIdentity`を使用します。
`Backend`のメソッドを呼び出すと、Actorが`DelegationIdentity`を使用して、Txに署名をして、ICPにTxを送信します。

## コードで理解しよう - Native(iOS/Android)編

今まで説明してきた内容をコードで理解しましょう。

### Expoアプリの起動時

#### `baseKey`のセットアップ
`baseKey`とは、アプリ用の`SignIdentity`です。

```typescript
const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
  undefined,
);
```
`baseKey`のために`React`の`state`を宣言します。

```typescript
const storedBaseKey = await SecureStore.getItemAsync('baseKey');
```
セキュアなストレージから、`baseKey`を読み込みます。

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
ストレージに`baseKey`が存在し、`React`の`state`として、`baseKey`が存在しない場合、
`baseKey`をJSONから復元して、`React`の`state`として保存します。
`Ed25519KeyIdentity`は、`SignIdentity`の一種です。

ストレージに`baseKey`が存在しない場合、新しい`Ed25519KeyIdentity`を生成し、
セキュアなストレージと`React`の`state`に保存します。
セキュアなストレージに保存するのは、`SignIdentity`の秘密鍵を保護するためです。

#### `identity`のセットアップ
`identity`とは、`DelegationIdentity`のことです。

```typescript
const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
  undefined,
);
```
`identity`のために`React`の`state`を宣言します。

```typescript
const storedDelegation = await AsyncStorage.getItem('delegation');
```
通常ストレージから、`delegation`を読み込みます。

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
`identity`が存在する場合は、何もしません。
`identity`が存在しない場合は、保存されていた`baseKey`と`delegation`から、`identity`を復元します。

```typescript
const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
const delegation = DelegationChain.fromJSON(storedDelegation);
const identity = DelegationIdentity.fromDelegation(baseKey, delegation);
```
`baseKey`と`delegation`をJSONから復元します。
`identity`を`baseKey`と`delegation`から復元します。

```typescript
if (isDelegationValid(delegation)) {
  console.log('Setting identity from baseKey and delegation');
  setIdentity(identity);
} else {
  console.log('Invalid delegation chain, removing delegation');
  await AsyncStorage.removeItem('delegation');
}
```
`delegation`が有効な場合、`identity`を`React`の`state`として保存します。
`delegation`が有効でない場合、`delegation`を通常ストレージから削除します。
`delegation`が有効でなくなる主な原因は、`delegation`の有効期限切れです。何も指定しない場合、有効期限は8時間です。

```typescript
const [isReady, setIsReady] = useState(false);
```
`identity`のセットアップが完了したかを示しているのが`isReady`です。
`isReady`のために`React`の`state`を宣言します。

```typescript
setIsReady(true);
```
`identity`のセットアップの最後に、`isReady`をtrueに更新します。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)

### Expoアプリでのログイン
Expoアプリのログイン時にすることは、`Internet Identity`に接続する`Web Frontend`を外部ブラウザ経由で呼び出すことです。
この`Web Frontend`を今後は、`ii-integration`と呼ぶことにします。

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

#### `redirectUri`の作成
`redirectUri`とは、`ii-integration`からExpoアプリにリダイレクトで戻ってくるためのURLです。

```typescript
import { ..., createURL } from 'expo-linking';
```
`Expo`でカスタムURLを使う場合、`createURL`を使用して、カスタムURLを取得します。
開発時に、`Expo Go`を使用する場合、カスタムURLは特殊なものになります。
`createURL`は、開発時と本番ビルド時の違いを吸収してくれます。

```typescript
const redirectUri = createURL('/');
```
`createURL`を使用して、`redirectUri`を作成します。

#### `pubkey`の作成
`pubkey`とは、`baseKey`の公開鍵です。

```typescript
if (!baseKey) {
  throw new Error('No base key');
}

const pubkey = toHex(baseKey.getPublicKey().toDer());
```
`baseKey`が存在しない場合、エラーを返します。
`baseKey`の公開鍵を取得し、`toHex`で、16進数の文字列に変換します。

#### `iiUri`の作成
`iiUri`とは、`Internet Identity`のURLです。

```typescript
const iiUri = getInternetIdentityURL();
```
`getInternetIdentityURL`を使用して、`iiUri`を作成します。

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
`ENV_VARS`は、`dfx deploy`時に作成される`.env`ファイルをタイプセーフに扱うことができるようにしたものです。
`dfx deploy`時に、自動的に作成されます。標準では作成されないので、どのように作成するのかは、別のドキュメントで解説します。

`DFX_NETWORK`は、`dfx deploy`時に指定したネットワークです。`ic`の場合、`Internet Identity`のURLは、`https://identity.ic0.app`になります。
`ic`以外の時は、`CANISTER_ID_INTERNET_IDENTITY`を使用して、`Internet Identity`のcanisterIdを取得します。
`canisterId`は、`canister`につけられている`ID`です。`canister`というのは、他のチェーンのスマートコントラクトだと理解しておくといいでしょう。

`isLocalhostSubdomainSupported()`は、ブラウザが、`localhost subdomain`をサポートしているかを返します。
`localhost subdomain`をサポートしている場合、URLは、`http://<canisterId>.localhost:4943`になります。
`localhost subdomain`をサポートしていない場合、URLは、`https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>`のようになります。

`localhost subdomain`をサポートしていない場合、PCからアクセスする場合は、`http://localhost:4943/canisterId=<canisterId>`も可能なのですが、`https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>`も同様に可能なので、話を単純化するために、`https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>`を使用します。

`isLocalhostSubdomainSupported()`は、すごく単純化すると、WebアプリがPCで動いていて、ブラウザが`Chrome`の場合のみ、trueを返します。

Expoアプリで、PCのWebアプリ以外(ネイティブアプリ、スマホWebアプリ)は、`https:`で`Local Canister`にアクセスする必要があります。
しかし、ICPの`Local Canister`は、`https:`をサポートしていません。
そこで、`Proxy`を使用して、`https:`のリクエストを`http:`にフォワードします。
このプロジェクトでは、`local-ssl-proxy`を使います。`package.json`に下記のエントリを書いて実行しておきます。

```json
"ssl:ii": "local-ssl-proxy --source 24943 --target 4943 --key ./.mkcert/192.168.0.210-key.pem --cert ./.mkcert/192.168.0.210.pem"
```
`target`が`http:`のポート番号、`source`が`https:`のポート番号です。`mkcert`を使って、ルート局をインストールしたり、x509の証明書を作ったりする必要もあるのですが、これについては別のドキュメントで説明します。

上記の設定で、`https://<HOSTのIPアドレス>:24943/canisterId=<canisterId>`へのリクエストは、`http://localhost:4943/canisterId=<canisterId>`にフォワードされます。

このチュートリアルでは、`24943`のポート番号を使っていますが、好きなポート番号を使って構いません。

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
`isLocalhostSubdomainSupported`を詳しく見ていきましょう。
`window?.location?.origin`に`localhost`が含まれていない場合、`false`を返します。
これは、PCからアクセスしているWebアプリに限定することを意味します。

`window?.navigator?.userAgent?.toLowerCase()`で、ブラウザのユーザーエージェントを取得します。
`userAgent`に`chrome`が含まれている場合、`true`を返します。
`userAgent`に`chrome`が含まれていない場合、`false`を返します。

わかりやすく言い換えれば、PCのWebアプリで、ブラウザが`Chrome`のときだけ、`true`を返すことになります。

ExpoのWebアプリで、PCから`Local Canister`にアクセスするテストは、`Chorome`と`Safari`だけで良いとするなら、これくらいの簡易実装もありでしょう。

#### `url`の作成
この`url`は、`ii-integration`にアクセスする`URL`です。

```typescript
const iiIntegrationURL = getCanisterURL(
  ENV_VARS.CANISTER_ID_II_INTEGRATION,
);
const url = new URL(iiIntegrationURL);
```
`getCanisterURL`は、先ほどの`getInternetIdentityURL`と非常によく似ていて、`Internet Identity`以外の`Canister`にアクセスするための`URL`を返します。

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
先ほどの`getInternetIdentityURL`とかなり似ているので、細かい説明は省きますが、ポート番号が`getInternetIdentityURL`のポート番号とは異なることは頭に入れておいてください。
これは、`Internet Identity`とそれを呼び出す側(`ii-integration`)のオリジンが異なっている必要があるためです。

#### クエリパラメータの設定
```typescript
url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('pubkey', pubkey);
url.searchParams.set('ii_uri', iiUri);
```
先ほど作成した`url`に、`redirect_uri`、`pubkey`、`ii_uri`を設定します。


#### 現在ページのパスの保存
```typescript
import { usePathname, ... } from 'expo-router';

const pathname = usePathname();

await AsyncStorage.setItem('lastPath', pathname);
```
ログイン処理から戻ってきた時に、現在のページに戻れるように、`lastPath`として、現在のページのパスを保存します。

#### `ii-integration`の呼び出し
```typescript
await WebBrowser.openBrowserAsync(url.toString());
```
先ほどの`url`を使って、`ii-integration`を呼び出します。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)

### `ii-integration`の起動時
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
`parseParams`は、`ii-integration`のURLから、`redirectUri`、`identity`、`iiUri`を取得します。

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
`URL`から、`redirectUri`、`pubkey`、`iiUri`を取得します。

`redirectUri`は、`ii-integration`からExpoアプリにリダイレクトで戻るためのURLです。

`pubkey`は、Expoアプリの`baseKey`の公開鍵です。

`iiUri`は、`Internet Identity`のURLです。

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
通常、`SignIdentity`は、公開鍵と秘密鍵を持っていますが、`Internet Identity`の認証で必要になるのは、`getPublicKey()`だけなので、このような簡易実装でも問題ありません。

```typescript
const authClient = await AuthClient.create({ identity });
```
`identity`を渡して`AuthClient`を作成します。
`identity`の公開鍵はExpoアプリのものなので、これにより、ユーザーが署名することをExpoアプリに委譲できるようになります。

```typescript
const loginButton = document.querySelector('#ii-login-button') as HTMLButtonElement;
```
`ii-login-button`という`ID`のボタンを取得します。

#### `authClient.login()`
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
`identityProvider`には、`Internet Identity`のURLを渡します。
`onSuccess`は、認証が成功した場合に呼ばれる関数です。
`onError`は、認証が失敗した場合に呼ばれる関数です。

認証が成功すると、`authClient.getIdentity()`で、`DelegationIdentity`を取得できます。
`buildRedirectURLWithDelegation`は、`DelegationIdentity`を使って、`redirectUri`に委譲情報を付与したURLを作成します。
`window.location.href`に、そのURLを設定することで、Expoアプリにリダイレクトで戻ります。

```typescript
const buildRedirectURLWithDelegation = (redirectUri: string, delegationIdentity: DelegationIdentity): string => {
  const delegationString = JSON.stringify(
    delegationIdentity.getDelegation().toJSON()
  );
  const encodedDelegation = encodeURIComponent(delegationString);
  return `${redirectUri}?delegation=${encodedDelegation}`;
};
```
`DelegationIdentity.getDelegation()`で、`DelegationChain`を取得できます。
`DelegationChain`は、ユーザーの公開鍵と、ユーザーがExpoアプリに署名することを委譲した証明書を持っています。
`DelegationChain`は、セキュアな情報を持っていないので、リダイレクトでExpoアプリに渡すことができます。

これで、`ii-integration`からExpoアプリにリダイレクトで`DelegationIdentity`を渡す仕組みが理解できましたね。

[ii-integrationのソースコード](../src/ii-integration/index.ts)

### `ii-integration`からExpoアプリに戻ってきた時
#### URLの取得
```typescript
const url = useURL();
```
`useURL`は、Expoアプリの`url`を取得するためのフックです。

#### `delegation`の取得
```typescript
const search = new URLSearchParams(url?.split('?')[1]);
const delegation = search.get('delegation');
```
`url`から、`delegation`を取得します。

#### `delegation`から`DelegationIdentity`を作成
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
この`hooks`は、`url`と`baseKey`が変化した時に呼び出されるため、常に`URL`に`delegation`パラメータが含まれているとは限りません。
そのため、`delegation`パラメータがある時のみ後続の処理を行います。

JSON文字列から、`chain`として`DelegationChain`を復元し、保存します。
`baseKey`と`chain`から、`DelegationIdentity`を作成し、`setIdentity`で保存します。

`WebBrowser.dismissBrowser()`で、`ii-integration`を閉じます。

`restorePreLoginScreen()`で、ログイン前の画面に戻します。

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
`AsyncStorage`から、`lastPath`を取得します。
`lastPath`がある場合、そのパスに戻ります。
`lastPath`がない場合、`router.replace('/')`で、ルート画面に戻ります。

[useAuth.tsのソースコード](../src/expo-starter-frontend/hooks/useAuth.ts)
