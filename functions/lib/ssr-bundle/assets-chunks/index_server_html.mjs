export default `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Xplora</title>
  <base href="/">
  <meta name="author" content="Xplora Develops">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  <!-- Google fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <style>@font-face{font-family:'Jost';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oDd4iYl.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;}@font-face{font-family:'Jost';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73ord4iYl.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family:'Jost';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oTd4g.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;}@font-face{font-family:'Jost';font-style:normal;font-weight:500;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oDd4iYl.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;}@font-face{font-family:'Jost';font-style:normal;font-weight:500;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73ord4iYl.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family:'Jost';font-style:normal;font-weight:500;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oTd4g.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;}@font-face{font-family:'Jost';font-style:normal;font-weight:600;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oDd4iYl.woff2) format('woff2');unicode-range:U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;}@font-face{font-family:'Jost';font-style:normal;font-weight:600;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73ord4iYl.woff2) format('woff2');unicode-range:U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;}@font-face{font-family:'Jost';font-style:normal;font-weight:600;font-display:swap;src:url(https://fonts.gstatic.com/s/jost/v19/92zatBhPNqw73oTd4g.woff2) format('woff2');unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;}</style>
  <style>@font-face{font-family:'Material Icons';font-style:normal;font-weight:400;src:url(https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2) format('woff2');}.material-icons{font-family:'Material Icons';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased;}</style>
  <link href="https://fonts.cdnfonts.com/css/glacial-indifference-2" rel="stylesheet">
  <script src="https://sdk.mercadopago.com/js/v2"></script>
  <script src="https://sdk.clip.mx/js/clip-sdk.js"></script>
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#004aad">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#004aad">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#004aad">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#004aad">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#004aad">
  <!-- Meta Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1165943558668247');
    fbq('track', 'PageView');
  </script>
  <script type="text/javascript">
    window.smartlook||(function(d) {
      var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
      var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
      c.charset='utf-8';c.src='https://web-sdk.smartlook.com/recorder.js';h.appendChild(c);
      })(document);
      smartlook('init', '0ca567da25fc545f4f31c50d10236f87c8434398', { region: 'eu' });
  </script>
  <!-- End Meta Pixel Code -->
<link rel="stylesheet" href="styles-DT3K3623.css"><link rel="preload" href="https://fonts.cdnfonts.com/css/glacial-indifference-2" as="style"></head>
<body class="mat-typography"><script type="text/javascript" id="ng-event-dispatch-contract">(()=>{function p(t,n,r,o,e,i,f,m){return{eventType:t,event:n,targetElement:r,eic:o,timeStamp:e,eia:i,eirp:f,eiack:m}}function u(t){let n=[],r=e=>{n.push(e)};return{c:t,q:n,et:[],etc:[],d:r,h:e=>{r(p(e.type,e,e.target,t,Date.now()))}}}function s(t,n,r){for(let o=0;o<n.length;o++){let e=n[o];(r?t.etc:t.et).push(e),t.c.addEventListener(e,t.h,r)}}function c(t,n,r,o,e=window){let i=u(t);e._ejsas||(e._ejsas={}),e._ejsas[n]=i,s(i,r),s(i,o,!0)}window.__jsaction_bootstrap=c;})();
</script>
  <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1165943558668247&ev=PageView&noscript=1"/></noscript>
  <app-root></app-root>
  <noscript>Please enable JavaScript to continue using this application.</noscript>
<link rel="modulepreload" href="chunk-DF6LICXL.js"><link rel="modulepreload" href="chunk-MNFQCXAS.js"><link rel="modulepreload" href="chunk-FK6H3RFT.js"><link rel="modulepreload" href="chunk-FKEF4KGE.js"><link rel="modulepreload" href="chunk-KYQJLLLG.js"><link rel="modulepreload" href="chunk-QWWW7GFA.js"><script src="polyfills-OYTHSGNX.js" type="module"></script><script src="scripts-WJ2VZGXS.js" defer=""></script><script src="main-E54AR2BK.js" type="module"></script></body>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyByagNTSU4t3SXMFKFnO949-Xx6PvJp7Wk&amp;libraries=places"></script>
<script src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js"></script>
<script src="assets/js/vendors.js"></script>
<script src="assets/js/main.js"></script>
</html>
`;