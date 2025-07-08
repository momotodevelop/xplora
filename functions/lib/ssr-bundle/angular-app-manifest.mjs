
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "src/app/pages/panel/admin/admin-lite-vouchers/admin-lite-vouchers.component.ts": [
    {
      "path": "chunk-B73SJSHE.js",
      "dynamicImport": false
    }
  ],
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    {
      "path": "chunk-EIURKOK5.js",
      "dynamicImport": false
    }
  ],
  "node_modules/sweetalert2/dist/sweetalert2.all.js": [
    {
      "path": "chunk-TRAS46HC.js",
      "dynamicImport": false
    }
  ],
  "node_modules/html2canvas/dist/html2canvas.js": [
    {
      "path": "chunk-DF4PZERS.js",
      "dynamicImport": false
    }
  ],
  "node_modules/dompurify/dist/purify.es.mjs": [
    {
      "path": "chunk-MLV7OERT.js",
      "dynamicImport": false
    }
  ],
  "node_modules/canvg/lib/index.es.js": [
    {
      "path": "chunk-3P67KBWB.js",
      "dynamicImport": false
    }
  ],
  "src/app/pages/panel/admin/admin.component.ts": [
    {
      "path": "chunk-MNIJGJTH.js",
      "dynamicImport": false
    }
  ],
  "src/app/pages/panel/admin/admin-dashboard/admin-dashboard.component.ts": [
    {
      "path": "chunk-CUJV6DG6.js",
      "dynamicImport": false
    }
  ],
  "src/app/pages/panel/admin/admin-bookings/admin-bookings.component.ts": [
    {
      "path": "chunk-OMIYL5WK.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 55763, hash: 'fcdced96212aef39703b8263afd986f89eaab11618876e04668371e6d95d6efc', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 7809, hash: '05bd7571379f0240a0c17bf058fa4722336bd5e4bcc5c215a08f881864850c7e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-DT3K3623.css': {size: 623316, hash: '8J2Gg5DTVx4', text: () => import('./assets-chunks/styles-DT3K3623_css.mjs').then(m => m.default)}
  },
};
