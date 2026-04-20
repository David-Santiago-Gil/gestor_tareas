
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
    'index.csr.html': {size: 1063, hash: '051e430b2f55f065c9be2b111222dface57b5e4cbafb3b5e062406a0fb10b9f9', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1603, hash: '617237d43aa65afc1653c93c702690fec2c32fe11df62305834505bb2000755a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 8681, hash: '57cd2a5e0cc6d1386b989663366977193cca0f0912730175cdeb5d336ebaef5f', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)}
  },
};
