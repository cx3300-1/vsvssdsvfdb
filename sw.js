// sw.js - Service Worker 脚本

// 监听 'push' 事件。当你的应用收到推送通知时，这个事件会被触发。
self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送事件！');

  // 在这里，你可以执行你原本希望在后台运行的任务。
  // 例如，你可以模拟一个“角色行动”，然后决定是否要给用户发送一个通知。
  
  // 这是一个模拟的后台行动逻辑
  const characterAction = () => {
    // 假设这里有一些复杂的逻辑来决定角色要做什么
    // ...
    // 最终，我们决定给用户发一个通知
    const title = 'EPhone - 你有新消息';
    const options = {
      body: '你的好友“李星辰”发布了一条新动态，快去看看吧！',
      icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1758510900942_qdqqd_djw0z2.jpeg', // 使用你的应用图标
      badge: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1758510900942_qdqqd_djw0z2.jpeg' // 通知栏小图标
    };
    
    // self.registration.showNotification 会显示一个系统通知
    event.waitUntil(self.registration.showNotification(title, options));
  };

  // 执行你的后台行动
  characterAction();
});

// (可选) 监听通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close(); // 关闭通知
  // 当用户点击通知时，打开你的应用
  event.waitUntil(
    clients.openWindow('/') // '/' 代表你的应用根URL
  );
});

