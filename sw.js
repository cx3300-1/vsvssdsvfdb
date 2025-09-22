// sw.js 文件 (修复版 V2)

// 【核心修改】将缓存版本号+1，这样浏览器才会重新安装新的Service Worker
const CACHE_NAME = 'ephone-cache-v2'; 

// 【核心修改】把您的GitHub仓库名填在这里
const REPO_NAME = '/vsvssdsvfdb/'; 

// 【核心修改】为所有本地文件路径加上仓库名前缀
// 建议您将 手18.html 重命名为 index.html，这样访问更方便
const urlsToCache = [
    REPO_NAME, // 代表仓库根目录, 即 index.html
    `${REPO_NAME}index.html`, // 显式缓存 index.html (如果已重命名)
    // `${REPO_NAME}手18.html`, // 如果您不想重命名，就用这行替换上面那行
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 安装 Service Worker 并缓存核心文件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存已打开，正在缓存核心文件...');
                return cache.addAll(urlsToCache);
            })
            .then(() => console.log('核心文件缓存成功！'))
            .catch(error => {
                console.error('addAll 失败:', error);
                // 抛出错误，让安装失败，以便下次重试
                throw error;
            })
    );
});

// 拦截网络请求，优先从缓存中获取
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// 删除旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('正在删除旧缓存:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
 



