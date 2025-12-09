(() => {
  const statusEl = document.getElementById('status');
  const listingEl = document.getElementById('listing');
  const refreshBtn = document.getElementById('refresh');

  const fallbackPages = [
    {
      title: 'Audio Visualizer',
      file: 'AudioVisulize.html',
      description: 'Material 3 风格的音频可视化，支持本地文件与麦克风输入。',
      tags: ['Audio', 'Visualizer', 'Material 3']
    },
    {
      title: 'FX Pro Simulator',
      file: 'FxSimulator.html',
      description: '外汇盘口模拟器，带键盘快捷键、滑条与多路数据面板。',
      tags: ['Trading', 'Simulator', 'Realtime UI']
    }
  ];

  const setStatus = (message) => {
    statusEl.textContent = message;
  };

  const renderItems = (items) => {
    listingEl.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'web/ 里暂时没有可用页面。';
      listingEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'item';

      const title = document.createElement('p');
      title.className = 'item__title';
      title.textContent = item.title || item.file;

      const desc = document.createElement('p');
      desc.className = 'item__desc';
      desc.textContent = item.description || 'Web 页面';

      const tags = document.createElement('div');
      tags.className = 'item__tags';
      (item.tags || []).forEach((tag) => {
        const t = document.createElement('span');
        t.className = 'item__tag';
        t.textContent = tag;
        tags.appendChild(t);
      });

      const actions = document.createElement('div');
      actions.className = 'item__actions';

      const liveLink = document.createElement('a');
      liveLink.className = 'primary';
      liveLink.href = `web/${item.file}`;
      liveLink.target = '_blank';
      liveLink.rel = 'noopener noreferrer';
      liveLink.textContent = '打开页面';

      const codeLink = document.createElement('a');
      codeLink.href = `web/${item.file}`;
      codeLink.target = '_blank';
      codeLink.rel = 'noopener noreferrer';
      codeLink.setAttribute('download', item.file);
      codeLink.textContent = '下载/查看文件';

      actions.appendChild(liveLink);
      actions.appendChild(codeLink);

      li.appendChild(title);
      li.appendChild(desc);
      if (item.tags?.length) {
        li.appendChild(tags);
      }
      li.appendChild(actions);
      listingEl.appendChild(li);
    });
  };

  const loadPages = async () => {
    setStatus('正在读取 pages.json …');
    try {
      const res = await fetch('pages.json', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      renderItems(items);
      setStatus(`web/ 下共 ${items.length} 个入口`);
    } catch (err) {
      console.warn('pages.json 加载失败，使用内置列表', err);
      renderItems(fallbackPages);
      setStatus(`使用内置列表，找到 ${fallbackPages.length} 个入口`);
    }
  };

  refreshBtn?.addEventListener('click', () => {
    loadPages();
  });

  loadPages();
})();
