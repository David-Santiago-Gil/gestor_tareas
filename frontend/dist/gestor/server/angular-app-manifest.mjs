
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 689, hash: '99367c49d96cf8ad0a23a5a1a3af05f9ac8eb98fd3565f57b0d968c998665291', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1229, hash: '5b02bca2d1c8e9cbebe1915ff1d7247f8a2443f90775d0ecb0287fe988d1467b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 9785, hash: 'eba85c37077e35564b9c11a4c063a8c9a5b6c8eda59090d45d11a8fbd3f06285', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)}
  },
};
