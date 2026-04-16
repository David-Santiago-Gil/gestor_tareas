
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
    'index.html': {size: 7574, hash: '6d481c2bb8b6f26d9b96b1d70b7180b2dc5752681323323121ed2f1b683c61f1', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)}
  },
};
