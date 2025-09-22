// sw.js 文件

const CACHE_NAME = 'ephone-cache-v1';
// 您应用的核心文件，确保包含了所有必要的资源
const urlsToCache = [
    '/',
    './手18.html',
    // 如果您有独立的CSS或JS文件，也在这里添加
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
                // 如果缓存中有匹配的响应，则返回它
                if (response) {
                    return response;
                }
                // 否则，执行网络请求
                return fetch(event.request);
            })
    );
});

