
// 【核心修改1】更新缓存版本号，强制浏览器更新Service Worker
const CACHE_NAME = 'ephone-cache-v4'; 
const REPO_NAME = '/vsvssdsvfdb/'; 

// 核心文件列表保持不变
const urlsToCache = [
    REPO_NAME,
    `${REPO_NAME}index.html`, // 假设您已将手18.html重命名为index.html
    'https://unpkg.com/dexie/dist/dexie.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 'install' 事件：缓存核心App Shell文件 (逻辑不变)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('缓存已打开，正在缓存核心文件...');
                return cache.addAll(urlsToCache);
            })
    );
});

// 'activate' 事件：删除旧缓存 (逻辑不变)
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


// 【【【核心修改2：这是全新的、更智能的 fetch 事件处理器】】】
self.addEventListener('fetch', event => {
    // 对非GET请求，我们不进行处理
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // 1. 首先，尝试从网络获取最新的资源
        fetch(event.request)
            .then(networkResponse => {
                // 2. 如果成功从网络获取到
                // 打开我们的缓存
                return caches.open(CACHE_NAME).then(cache => {
                    // 将新获取的资源存入缓存（克隆一份，因为response只能使用一次）
                    cache.put(event.request, networkResponse.clone());
                    // 将网络响应返回给页面
                    return networkResponse;
                });
            })
            .catch(() => {
                // 3. 如果网络请求失败了（例如，用户离线了）
                // 那么，我们尝试从缓存中寻找匹配的资源
                return caches.match(event.request).then(cachedResponse => {
                    // 如果缓存中有，就返回缓存的版本
                    // 如果缓存中也没有，对于SPA来说，我们应该返回主页面
                    return cachedResponse || caches.match(`${REPO_NAME}index.html`);
                });
            })
    );
});

// 在 sw.js 文件末尾添加

// 3. 监听周期性后台同步事件
self.addEventListener('periodicsync', event => {
    if (event.tag === 'run-ai-simulation') {
        console.log('后台模拟任务被唤醒！');
        // event.waitUntil() 会确保在任务完成前，Service Worker 不会休眠
        event.waitUntil(runAISimulation());
    }
});

// 4. “后台行动”的具体执行函数
async function runAISimulation() {
    console.log('开始执行AI后台模拟...');
    // 因为 Service Worker 中无法直接访问 Dexie，我们需要自己实现一个精简版的 IndexedDB 访问
    const db = await openDatabase();

    const globalSettings = await getObject(db, 'globalSettings', 'main');
    // 如果用户关闭了后台活动，则直接退出
    if (!globalSettings || !globalSettings.enableBackgroundActivity) {
        console.log('后台活动总开关已关闭，跳过本次模拟。');
        return;
    }

    const allChats = await getAllObjects(db, 'chats');

    for (const chat of allChats) {
        // 我们只处理单聊角色的独立行动
        if (!chat.isGroup && chat.relationship?.status === 'friend') {
             // 随机决定此角色本次是否行动 (例如：20%的几率)
            if (Math.random() < 0.2) { 
                console.log(`角色 "${chat.name}" 决定行动...`);
                // 这里可以放置您更复杂的AI决策逻辑
                // 为简化，我们这里直接让他发一条消息
                const newMessage = {
                    role: 'assistant',
                    senderName: chat.originalName,
                    content: '（在后台思考后，决定给你发条消息）',
                    timestamp: Date.now()
                };
                chat.history.push(newMessage);
                chat.unreadCount = (chat.unreadCount || 0) + 1;

                // 将更新后的聊天数据存回数据库
                await updateObject(db, 'chats', chat);

                // 发送通知！
                showNotification(chat, newMessage.content);
            }
        }
    }
}

// 5. 在 Service Worker 中发送通知
function showNotification(chat, messageContent) {
    const title = chat.name;
    const options = {
        body: messageContent,
        icon: chat.settings.aiAvatar || '/path/to/default-icon.png', // 替换为您的默认图标路径
        data: {
            chatId: chat.id // 将chatId存入通知数据，方便点击后跳转
        }
    };
    // self.registration.showNotification 是在 Service Worker 中显示通知的方法
    return self.registration.showNotification(title, options);
}

// 6. 监听通知点击事件
self.addEventListener('notificationclick', event => {
    event.notification.close(); // 关闭通知
    const chatId = event.notification.data.chatId;

    // 这段代码会找到所有当前PWA的窗口，并聚焦到第一个
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // 如果PWA窗口已打开，则直接聚焦并发送消息
                if (client.url === self.location.origin + '/手18.html' && 'focus' in client) {
                    client.postMessage({ type: 'OPEN_CHAT', chatId: chatId });
                    return client.focus();
                }
            }
            // 如果PWA窗口未打开，则打开一个新的
            if (clients.openWindow) {
                // 将 chatId 作为 URL 参数传递
                return clients.openWindow(`/手18.html?chatId=${chatId}`);
            }
        })
    );
});

// --- IndexedDB 辅助函数 ---
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('GeminiChatDB');
        request.onerror = event => reject("数据库打开失败");
        request.onsuccess = event => resolve(event.target.result);
    });
}

function getObject(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("读取对象失败");
    });
}

function getAllObjects(db, storeName) {
     return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("读取所有对象失败");
    });
}

function updateObject(db, storeName, object) {
     return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(object);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("更新对象失败");
    });
}
 





