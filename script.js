(() => {
  const form = document.getElementById('repo-form');
  const ownerInput = document.getElementById('owner');
  const repoInput = document.getElementById('repo');
  const branchInput = document.getElementById('branch');
  const statusEl = document.getElementById('status');
  const listingEl = document.getElementById('listing');
  const breadcrumbsEl = document.getElementById('breadcrumbs');

  const state = {
    owner: '',
    repo: '',
    branch: 'main',
    path: 'web'
  };

  const icons = {
    file: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 4.5h5.378c.335 0 .658.133.896.371l3.105 3.105c.238.238.371.561.371.896V19.5a.75.75 0 01-.75.75H8.25A2.25 2.25 0 016 18V6.75A2.25 2.25 0 018.25 4.5z"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 8.25h16.5M3.75 8.25A2.25 2.25 0 016 6h2.628c.414 0 .81.17 1.09.47l1.064 1.13c.28.3.676.47 1.09.47H18a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 19.5H6A2.25 2.25 0 013.75 17.25V8.25z"/></svg>'
  };

  function guessRepo() {
    const { host, pathname } = window.location;
    const parts = pathname.split('/').filter(Boolean);
    const guess = {
      owner: host.endsWith('github.io') ? host.split('.')[0] : '',
      repo: parts.length ? parts[0] : ''
    };
    return guess;
  }

  function loadConfig() {
    const savedRaw = window.localStorage.getItem('vibecoding-repo');
    if (savedRaw) {
      try {
        const saved = JSON.parse(savedRaw);
        state.owner = saved.owner || '';
        state.repo = saved.repo || '';
        state.branch = saved.branch || 'main';
        state.path = 'web';
        return;
      } catch (_) {
        // ignore corrupted storage
      }
    }
    const guessed = guessRepo();
    state.owner = guessed.owner;
    state.repo = guessed.repo;
    state.branch = 'main';
    state.path = 'web';
  }

  function persistConfig() {
    window.localStorage.setItem('vibecoding-repo', JSON.stringify({
      owner: state.owner,
      repo: state.repo,
      branch: state.branch
    }));
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function updateFormFields() {
    ownerInput.value = state.owner;
    repoInput.value = state.repo;
    branchInput.value = state.branch;
  }

  function buildBreadcrumbs() {
    breadcrumbsEl.textContent = `${state.repo || 'repo'}/web`;
  }

  function renderItems(items) {
    listingEl.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Nothing here yet.';
      listingEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'item';

      const link = document.createElement('a');
      link.className = 'item__name';
      const liveUrl = new URL(`web/${item.name}`, window.location.href).toString();
      link.href = liveUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = `${icons.file}<span>${item.name}</span>`;

      const meta = document.createElement('div');
      meta.className = 'item__meta';
      meta.innerHTML = `<a href="${item.download_url}" target="_blank" rel="noopener noreferrer">Raw</a> · <a href="${item.html_url}" target="_blank" rel="noopener noreferrer">GitHub</a>`;

      li.appendChild(link);
      li.appendChild(meta);
      listingEl.appendChild(li);
    });
  }

  async function loadListing() {
    if (!state.owner || !state.repo) {
      setStatus('Set owner and repo to load contents.');
      listingEl.innerHTML = '';
      breadcrumbsEl.textContent = '';
      return;
    }

    buildBreadcrumbs();
    setStatus('Loading from GitHub…');
    const path = '/web';
    const url = `https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents${path}?ref=${encodeURIComponent(state.branch)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`GitHub API error ${res.status}`);
      }
      const data = await res.json();
      const htmlFiles = data
        .filter((item) => item.type === 'file' && /\.html?$/i.test(item.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      renderItems(htmlFiles);
      setStatus(`Showing ${htmlFiles.length} page(s) from ${state.owner}/${state.repo}@${state.branch}/web`);
    } catch (err) {
      renderItems([]);
      setStatus(`Failed to load web/: ${err.message}`);
      console.error(err);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.owner = ownerInput.value.trim();
    state.repo = repoInput.value.trim();
    state.branch = branchInput.value.trim() || 'main';
    state.path = 'web';
    persistConfig();
    loadListing();
  });

  loadConfig();
  updateFormFields();
  state.path = 'web';
  loadListing();
})();
