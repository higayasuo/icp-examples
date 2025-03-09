import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline';
            connect-src 'self' http://localhost:4943 http://*.localhost:4943 https://192.168.0.210:* https://icp0.io https://*.icp0.io https://icp-api.io https://identity.ic0.app https://ic0.app https://*.ic0.app https://*.raw.ic0.app;
            frame-src 'self' http://localhost:4943 http://*.localhost:4943 https://192.168.0.210:* https://identity.ic0.app https://ic0.app https://*.ic0.app;
            img-src 'self' data:;
            style-src * 'unsafe-inline';
            style-src-elem * 'unsafe-inline';
            font-src *;
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            upgrade-insecure-requests;"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
