import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <title>Quadrata App</title>
        <meta name="description" content="Seus seguros na palma da mão — Quadrata Seguros" />

        {/* PWA */}
        <link rel="manifest" href="/quadrata/manifest.json" />
        <meta name="theme-color" content="#0D2B6E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Quadrata" />
        <link rel="apple-touch-icon" href="/quadrata/icon-192.png" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body { background-color: #0D2B6E; overscroll-behavior-y: none; }
          #root { display: flex; min-height: 100vh; }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/quadrata/sw.js', { scope: '/quadrata/' }).catch(function(){});
            });
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
