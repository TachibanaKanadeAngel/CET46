self.addEventListener('widgetinstall', (event) => {
  console.log('✅ Widget 已安装');
});

self.addEventListener('widgetupdate', (event) => {
  const data = event.data || {};
  
  event.update({
    pendingReviews: data.pendingReviews || 0,
    todayLearned: data.todayLearned || 0,
    streak: data.streak || 0,
    learnedWords: data.learnedWords || 0
  });
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WIDGET_UPDATE') {
    const widgetData = event.data.data;
    
    if (clients.matchAll) {
      clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'WIDGET_UPDATED',
            data: widgetData
          });
        });
      });
    }
  }
});
