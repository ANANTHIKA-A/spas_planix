import { initApp, getTasks, saveTasks, calculateTimeRemaining, getCurrentUser } from './shared.js';

// Setup basic requirements
initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const tasksContainer = document.getElementById('tasks-container');
    const taskCountEl = document.getElementById('task-count');
    
    // Tabs elements
    const tabAll = document.getElementById('tab-all');
    const tabPending = document.getElementById('tab-pending');
    const tabCompleted = document.getElementById('tab-completed');

    // Search elements
    const searchInput = document.getElementById('task-search-input');
    const dateSearchInput = document.getElementById('task-date-search');

    if (searchInput) searchInput.addEventListener('input', () => renderTasks());
    if (dateSearchInput) dateSearchInput.addEventListener('input', () => renderTasks());
    
    let currentTab = 'all';

    let tasks = await getTasks();
    let renderInterval;

    function setTab(tabName) {
        currentTab = tabName;
        const tabs = { 'all': tabAll, 'pending': tabPending, 'completed': tabCompleted };
        
        Object.keys(tabs).forEach(k => {
            if (tabs[k]) {
                if (k === currentTab) {
                    tabs[k].style.background = 'var(--text-primary)';
                    tabs[k].style.color = 'var(--bg-color)';
                } else {
                    tabs[k].style.background = 'transparent';
                    tabs[k].style.color = 'var(--text-secondary)';
                }
            }
        });
        
        renderTasks();
    }

    if (tabAll) tabAll.addEventListener('click', () => setTab('all'));
    if (tabPending) tabPending.addEventListener('click', () => setTab('pending'));
    if (tabCompleted) tabCompleted.addEventListener('click', () => setTab('completed'));

    function renderTasks() {
        if (!tasksContainer) return;

        // Ensure older tasks without status are considered pending
        tasks.forEach(t => { if(!t.status) t.status = 'pending'; });

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const dateTerm = typeof dateSearchInput !== 'undefined' && dateSearchInput ? dateSearchInput.value : '';

        let filteredTasks = tasks;
        
        if (currentTab !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.status === currentTab);
        }
        
        if (searchTerm || dateTerm) {
            filteredTasks = filteredTasks.filter(t => {
                let textMatch = true;
                let dateMatch = true;

                if (searchTerm) {
                    const titleMatch = t.title.toLowerCase().includes(searchTerm);
                    const descMatch = (t.description || '').toLowerCase().includes(searchTerm);
                    textMatch = titleMatch || descMatch;
                }

                if (dateTerm) {
                    dateMatch = t.deadline.startsWith(dateTerm);
                }

                return textMatch && dateMatch;
            });
        }
        
        taskCountEl.textContent = `${filteredTasks.length} ${currentTab === 'all' ? '' : currentTab + ' '}tasks found`;

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <svg style="margin-bottom: 1rem; color: var(--text-secondary);" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <p>No tasks match your search criteria.</p>
                </div>
            `;
            return;
        }

        // Sort by deadline Ascending (urgent first)
        const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        let html = '';

        const generateTaskHTML = (task) => {
            const timeStr = calculateTimeRemaining(task.deadline);
            const isOverdue = timeStr === "Overdue";
            const timeClass = isOverdue && task.status === 'pending' ? "time-overdue" : "time-remaining";
            
            const dateObj = new Date(task.deadline);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

            let actionsHtml = '';
            if (task.status === 'pending') {
                actionsHtml = `
                    <button class="btn-icon complete-btn" data-id="${task.id}" title="Mark Complete" style="color:var(--success-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${task.id}" title="Delete" style="color:var(--danger-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;
            } else {
                actionsHtml = `
                    <button class="btn-icon restore-btn" data-id="${task.id}" title="Restore to Pending" style="color:var(--accent-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${task.id}" title="Permanently Delete" style="color:var(--danger-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;
            }

            return `
                <div class="task-item" data-id="${task.id}" style="${task.status === 'completed' ? 'opacity:0.6;' : ''}">
                    <div class="task-content">
                        <div class="task-header">
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                            <span class="priority-badge" style="background: var(--glass-border); color: var(--text-secondary); margin-left: 6px;">${task.difficulty === 'hard' ? 'Hard' : 'Easy'}</span>
                            <div class="task-title" style="margin-left: 8px; ${task.status === 'completed' ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">${task.title}</div>
                        </div>
                        <div class="task-desc" style="${task.status === 'completed' ? 'text-decoration: line-through;' : ''}">${task.description || 'No description provided.'}</div>
                        
                        <div class="task-meta">
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${dateStr}
                            </span>
                            <span class="${task.status === 'pending' ? timeClass : 'time-remaining'}" style="${task.status === 'completed' ? 'color: var(--success-color);' : ''}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${task.status === 'completed' ? 'Completed' : timeStr}
                            </span>
                        </div>
                    </div>
                    
                    <div class="task-actions" style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        };

        html += sortedTasks.map(generateTaskHTML).join('');

        tasksContainer.innerHTML = html;

        // Attach action listeners
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                changeTaskStatus(id, 'completed');
            });
        });
        
        document.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                changeTaskStatus(id, 'pending');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm('Permanently delete this task?')) {
                    const id = e.currentTarget.getAttribute('data-id');
                    deleteTask(id);
                }
            });
        });
    }

    function startTimer() {
        if (renderInterval) clearInterval(renderInterval);
        renderTasks();
        renderInterval = setInterval(() => {
            renderTasks();
        }, 60000); // Re-render every minute to update remaining time
    }

    function changeTaskStatus(id, newStatus) {
        const idx = tasks.findIndex(t => t.id === id);
        if(idx !== -1) {
            tasks[idx].status = newStatus;
            saveTasks(tasks);
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        renderTasks();
    }

    // Start rendering the task list
    startTimer();
    
    // Focus search input by default on load for UX
    if (searchInput) searchInput.focus();
});
