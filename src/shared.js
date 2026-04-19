// Theme management
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update icon
      toggleBtn.innerHTML = newTheme === 'dark' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    });
  }
}

// Authentication check
export function checkAuth() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');
  
  if (!isLoggedIn && !isLoginPage && !isIndexPage) {
    window.location.href = '/login.html';
  } else if (isLoggedIn && (isLoginPage || isIndexPage)) {
    window.location.href = '/dashboard.html';
  }

  // Setup logout listener if we are not on login page
  if (!isLoginPage) {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('spas_user');
        window.location.href = '/login.html';
      });
    }
  }
}

// Global initialization
export function initApp() {
  initTheme();
  checkAuth();
}

// Task state management
export function getCurrentUser() {
  return localStorage.getItem('spas_user') || 'default_user';
}

export async function getUserProfile() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser === 'default_user') return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/${currentUser}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateUserXP(xpToAdd, dateStr) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser === 'default_user') return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/${currentUser}/xp`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xpToAdd, dateStr })
    });
    if (!res.ok) throw new Error('Failed to update XP');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getTasks() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser === 'default_user') return [];
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/tasks?userId=${currentUser}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    
    const tasks = await res.json();
    
    const now = new Date().getTime();
    let modified = false;
    tasks.forEach(t => {
      if (t.status === 'pending' && t.deadline) {
        const target = new Date(t.deadline).getTime();
        // Overdue by at least 1 second
        if (target < now) {
          const eod = new Date();
          eod.setHours(23, 59, 59, 999);
          if (eod.getTime() <= now) eod.setDate(eod.getDate() + 1);
          
          t.deadline = eod.toISOString();
          if (!t.title.includes('[Rescheduled]')) {
             t.title = '[Rescheduled] ' + t.title;
          }
          modified = true;
        }
      }
    });

    if (modified) saveTasks(tasks);

    return tasks;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function saveTasks(tasks) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser === 'default_user') return;
  
  try {
    await fetch(`${API_BASE_URL}/api/tasks/bulk?userId=${currentUser}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks)
    });
  } catch (err) {
    console.error(err);
  }
}

export function calculateTimeRemaining(deadline) {
  const now = new Date().getTime();
  const target = new Date(deadline).getTime();
  const distance = target - now;

  if (distance < 0) {
    return "Overdue";
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
