// service-worker.js

// 引入 Dexie.js 库，以便在后台访问数据库
importScripts('https://unpkg.com/dexie/dist/dexie.js');

// 定义数据库结构（必须和主页面中的定义完全一致）
const db = new Dexie('GeminiChatDB');
db.version(32).stores({
    doubanPosts: '++id, timestamp',
    chats: '&id, isGroup, groupId, isPinned, memos, diary, appUsageLog',
    apiConfig: '&id',
    globalSettings: '&id',
    userStickers: '&id, url, name, categoryId',
    worldBooks: '&id, name, categoryId',
    worldBookCategories: '++id, name',
    musicLibrary: '&id',
    personaPresets: '&id',
    qzoneSettings: '&id',
    qzonePosts: '++id, timestamp, authorId',
    qzoneAlbums: '++id, name, createdAt',
    qzonePhotos: '++id, albumId',
    favorites: '++id, type, timestamp, originalTimestamp',
    qzoneGroups: '++id, name',
    memories: '++id, chatId, timestamp, type, targetDate',
    callRecords: '++id, chatId, timestamp, customName',
    shoppingProducts: '++id, name, description',
    apiPresets: '++id, name',
    renderingRules: '++id, name, chatId',
    appearancePresets: '++id, name, type',
    stickerCategories: '++id, name'
});


// 当浏览器唤醒 Service Worker 执行周期性同步任务时，会触发这个事件
self.addEventListener('periodicsync', (event) => {
    // 我们只响应我们自己注册的那个任务
    if (event.tag === 'character-activity-sync') {
        // event.waitUntil() 会告诉浏览器，我们的任务正在进行中，请不要马上休眠
        event.waitUntil(runCharacterSimulation());
    }
});

/**
 * 这是在后台运行的核心模拟函数
 */
async function runCharacterSimulation() {
    console.log('后台模拟任务启动...');

    try {
        // 从数据库中读取所有单聊角色
        const allSingleChats = await db.chats.where('isGroup').notEqual(1).toArray();
        if (allSingleChats.length === 0) {
            console.log('没有可模拟的角色，任务结束。');
            return;
        }

        // 随机选择一个角色进行活动
        const characterToAct = allSingleChats[Math.floor(Math.random() * allSingleChats.length)];

        // 这是一个非常简化的决策逻辑，您可以根据需要把它改得更复杂
        // 例如，可以读取角色的长期记忆和人设，来决定TA要说什么
        const shouldAct = Math.random() < 0.5; // 假设有50%的几率角色会想搞点事

        if (shouldAct) {
            const message = `“${characterToAct.name}” 好像有话想对你说...`;

            // 使用 Service Worker 的 API 来显示系统通知
            await self.registration.showNotification('EPhone 新消息', {
                body: message,
                icon: characterToAct.settings.aiAvatar, // 使用角色的头像作为通知图标
                data: { chatId: characterToAct.id } // 将 chatId 存入通知数据中
            });
            console.log(`已为角色 "${characterToAct.name}" 发送后台通知。`);

        } else {
            console.log(`角色 "${characterToAct.name}" 决定保持安静，本次不发送通知。`);
        }

    } catch (error) {
        console.error('后台模拟任务失败:', error);
    }
}


// 当用户点击我们发出的通知时，会触发这个事件
self.addEventListener('notificationclick', (event) => {
    // 关闭通知
    event.notification.close();

    // 获取我们之前存入的 chatId
    const chatId = event.notification.data.chatId;

    // 尝试打开或聚焦到应用的窗口
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 如果已经有一个窗口打开了，就聚焦到它
            for (const client of clientList) {
                // 并通过 postMessage 告诉页面应该打开哪个聊天
                if (client.url.includes('手32美.html') && 'focus' in client) {
                    client.postMessage({ type: 'open_chat', chatId: chatId });
                    return client.focus();
                }
            }
            // 如果没有窗口打开，就打开一个新的
            if (clients.openWindow) {
                // 打开新窗口后，同样告诉它要打开哪个聊天
                clients.openWindow('手32美.html').then(client => {
                     client.postMessage({ type: 'open_chat', chatId: chatId });
                });
            }
        })
    );
});

// sw.js - ✅ 修改后的正确代码
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(networkResponse => {
                // ★★★ 核心修改就在这里 ★★★
                // 在尝试缓存之前，检查请求的协议是不是 http 或 https
                if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
                    let responseToCache = networkResponse.clone();
                    caches.open('my-cache-name').then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });
        })
    );
});


