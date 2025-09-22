// sw.js 文件 (修复版)

const CACHE_NAME = 'ephone-cache-v2'; // 更新缓存版本号，确保浏览器获取最新版本
const REPO_NAME = '/vsvssdsvfdb/'; // <-- 【核心修改1】在这里填入您的仓库名称

// 【核心修改2】修正所有文件的路径
const urlsToCache = [
    REPO_NAME, // 这代表仓库的根目录，即您的 index.html
    `${REPO_NAME}index.html`, // 显式地缓存 index.html
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 1. 安装 Service Worker 并缓存核心文件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. 拦截网络请求，优先从缓存中获取
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// 3. 删除旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
 


