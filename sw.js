// Service Worker 文件 (sw.js)

// 监听 periodicbackgroundsync 事件
// 这是当浏览器决定唤醒你的 Service Worker 时触发的事件
self.addEventListener('periodicsync', (event) => {
  // 我们给这个同步任务起个名字叫 'run-background-simulation'
  if (event.tag === 'run-background-simulation') {
    // event.waitUntil() 告诉浏览器任务正在进行中，在任务完成前不要终止 Service Worker
    event.waitUntil(runBackgroundSimulationTick());
  }
});

// 这是一个简化版的后台行动函数
// 注意：Service Worker 不能直接访问主页面的 DOM 或 Dexie.js 实例
// 因此，我们需要在这里重新初始化数据库连接
// 您需要将 Dexie.js 的库也引入到 Service Worker 中
importScripts('https://unpkg.com/dexie/dist/dexie.js');

async function runBackgroundSimulationTick() {
    console.log("Service Worker 被唤醒，开始执行后台模拟心跳...");

    // 在 Service Worker 中重新连接数据库
    const db = new Dexie('GeminiChatDB');
    // 定义与主页面完全相同的数据库结构
    db.version(31).stores({ 
        chats: '&id, isGroup, groupId, isPinned, memos, diary, appUsageLog',
        apiConfig: '&id', 
        globalSettings: '&id', 
        userStickers: '&id, url, name, categoryId',
        worldBooks: '&id, name, categoryId',
        worldBookCategories: '++id, name',
        musicLibrary: '&id', 
        personaPresets: '&id',
        qzoneSettings: '&id',
        qzonePosts: '++id, timestamp', 
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

    try {
        const globalSettings = await db.globalSettings.get('main');
        if (!globalSettings || !globalSettings.enableBackgroundActivity) {
            console.log("后台活动总开关未开启，Service Worker 终止本次任务。");
            return;
        }

        const allChats = await db.chats.toArray();
        const singleChats = allChats.filter(chat => !chat.isGroup);

        // 这里的后台行动逻辑可以保持不变
        // 注意：在 Service Worker 中不能使用 alert 或 DOM 操作
        // 您可以将需要通知用户的部分改为使用推送通知 (Push Notifications)
        for (const chat of singleChats) {
            if (chat.relationship?.status === 'blocked_by_user') {
                // ... (省略好友申请逻辑，保持不变) ...
            } else if (chat.relationship?.status === 'friend') {
                 // 在这里执行您的后台行动决策，比如调用 triggerInactiveAiAction
                 // 请注意：您需要将 triggerInactiveAiAction 及其依赖的所有函数
                 // 也复制到这个 sw.js 文件中，并确保它们不操作DOM。
                 console.log(`后台检查角色: ${chat.name}`);
            }
        }
        
        console.log("Service Worker 后台任务执行完毕。");

    } catch (error) {
        console.error("Service Worker 在执行后台任务时出错:", error);
    }
}
