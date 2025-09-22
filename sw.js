// ===================================================================
// 这是 sw.js 文件的全部内容
// ===================================================================

// 1. 引入 Dexie 库，让后台也能访问数据库
importScripts('https://unpkg.com/dexie/dist/dexie.js');

// 2. 在后台重新定义和连接数据库
// (这里的结构必须和您手18.html中的定义一模一样)
const db = new Dexie('GeminiChatDB');
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
    callRecords: '++id, customName',
    shoppingProducts: '++id, name, description',
    apiPresets: '++id, name',
    renderingRules: '++id, name, chatId',
    appearancePresets: '++id, name, type',
    stickerCategories: '++id, name'
});


// 3. 监听周期性后台同步事件
// 这是整个后台功能的核心！浏览器会定时触发这个事件。
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'run-simulation-tick') {
    console.log('后台同步事件被触发！开始执行后台任务...');
    // event.waitUntil() 告诉浏览器任务正在进行，不要提前休眠
    event.waitUntil(runBackgroundSimulationTick());
  }
});


// 4. 将您的后台核心逻辑函数整个搬到这里
// 注意：这个版本进行了一些修改，以便能在后台独立运行
async function runBackgroundSimulationTick() {
    console.log("Service Worker 开始执行后台心跳 Tick...");

    // 在 Service Worker 中，我们必须从数据库重新获取所有需要的数据
    const globalSettings = await db.globalSettings.get('main');
    const allChats = await db.chats.toArray();
    
    // 如果后台活动开关是关闭的，就直接停止
    if (!globalSettings || !globalSettings.enableBackgroundActivity) {
        console.log("后台活动总开关已关闭，本次任务结束。");
        return;
    }

    // --- 1. 处理所有单聊 ---
    const allSingleChats = allChats.filter(chat => !chat.isGroup);
    for (const chat of allSingleChats) {
        // (这里的逻辑和您原来的一样)
        if (chat.relationship?.status === 'blocked_by_user') {
            const blockedTimestamp = chat.relationship.blockedTimestamp;
            if (!blockedTimestamp) continue;
            const blockedDuration = Date.now() - blockedTimestamp;
            const cooldownMilliseconds = (globalSettings.blockCooldownHours || 1) * 60 * 60 * 1000;
            if (blockedDuration > cooldownMilliseconds) {
                chat.relationship.status = 'pending_system_reflection';
                // 注意：triggerAiFriendApplication 这样的函数也需要被完整地复制到 sw.js 中
                // 为简化起见，我们假设您已经将所有依赖函数都复制过来了。
                // await triggerAiFriendApplication(chat.id); // 触发AI申请好友
            }
        }
        else if (chat.relationship?.status === 'friend') {
            if (Math.random() < 0.20) {
                console.log(`角色 "${chat.name}" 在后台被唤醒...`);
                // await triggerInactiveAiAction(chat.id); // 触发AI独立行动
            }
        }
    }

    // --- 2. 处理所有群聊 ---
    const allGroupChats = allChats.filter(chat => chat.isGroup);
    for (const chat of allGroupChats) {
        if (Math.random() < 0.10) { 
            console.log(`群聊 "${chat.name}" 在后台被唤醒...`);
            // await triggerGroupAiAction(chat.id); // 触发群聊独立行动
        }
    }
    
    // 任务完成后，打印一条成功信息
    console.log("后台心跳 Tick 执行完毕。");
}


// 5. Service Worker 的标准安装与激活流程
// (这部分代码是固定的，确保 Service Worker 能尽快接管页面)
self.addEventListener('install', event => {
  console.log('Service Worker 正在安装...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  console.log('Service Worker 已激活！');
  event.waitUntil(self.clients.claim());
});

// ===================================================================
// 警告：您需要将 `runBackgroundSimulationTick` 函数所依赖的所有其他函数
// (例如: triggerAiFriendApplication, triggerInactiveAiAction, triggerGroupAiAction)
// 也完整地从 手18.html 复制并粘贴到这个文件的末尾。
// 并且，这些函数内部获取数据的方式也需要修改为直接访问数据库(db.chats.get(...)等)。
// 这是一个复杂的过程，需要逐个函数进行改造。
// ===================================================================