(() => {
  const userMenu = document.querySelector('.user-menu[data-player-level-url]');
  const levelValues = () => document.querySelectorAll('[data-player-level-value]');
  if (!userMenu || levelValues().length === 0) {
    return;
  }

  let refreshPromise = null;
  let refreshRequestedAgain = false;

  async function fetchAndRenderPlayerLevel() {
    try {
      const response = await fetch(userMenu.dataset.playerLevelUrl, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const level = Number(payload?.level);
      if (!Number.isSafeInteger(level) || level < 1) {
        return;
      }

      levelValues().forEach(element => {
        element.textContent = String(level);
      });
    } catch (error) {
      // Keep the server-rendered level if a transient refresh request fails.
    }
  }

  window.refreshPlayerLevel = function refreshPlayerLevel() {
    if (refreshPromise) {
      refreshRequestedAgain = true;
      return refreshPromise;
    }

    refreshPromise = (async () => {
      do {
        refreshRequestedAgain = false;
        await fetchAndRenderPlayerLevel();
      } while (refreshRequestedAgain);
    })().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  };

  void window.refreshPlayerLevel();
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      void window.refreshPlayerLevel();
    }
  });
})();
