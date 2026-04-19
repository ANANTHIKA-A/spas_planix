import { initApp, getTasks, saveTasks, calculateTimeRemaining, getCurrentUser, getUserProfile, updateUserXP } from './shared.js';

// Setup basic requirements
initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const userGreetingName = document.getElementById('user-greeting-name');
    if (userGreetingName) {
        userGreetingName.textContent = getCurrentUser();
    }

    const taskForm = document.getElementById('add-task-form');
    const tasksContainer = document.getElementById('tasks-container');
    const taskCountEl = document.getElementById('task-count');
    
    // Tabs elements
    const tabPending = document.getElementById('tab-pending');
    const tabCompleted = document.getElementById('tab-completed');

    
    let currentTab = 'pending';
    let editingTaskId = null;

    // Set default datetime to tomorrow
    const deadlineInput = document.getElementById('task-deadline');
    if (deadlineInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        deadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }

    let tasks = await getTasks();
    let renderInterval;

    function setTab(tabName) {
        currentTab = tabName;
        if (tabName === 'pending') {
            tabPending.style.background = 'var(--text-primary)';
            tabPending.style.color = 'var(--bg-color)';
            tabCompleted.style.background = 'transparent';
            tabCompleted.style.color = 'var(--text-secondary)';
        } else {
            tabCompleted.style.background = 'var(--text-primary)';
            tabCompleted.style.color = 'var(--bg-color)';
            tabPending.style.background = 'transparent';
            tabPending.style.color = 'var(--text-secondary)';
        }
        renderTasks();
    }

    if (tabPending) tabPending.addEventListener('click', () => setTab('pending'));
    if (tabCompleted) tabCompleted.addEventListener('click', () => setTab('completed'));

    function renderTasks() {
        if (!tasksContainer) return;

        // Ensure older tasks without status are considered pending
        tasks.forEach(t => { if(!t.status) t.status = 'pending'; });

        let filteredTasks = tasks.filter(t => t.status === currentTab);
        
        taskCountEl.textContent = `${filteredTasks.length} ${currentTab} tasks`;
        
        updateAIAdvisor(filteredTasks, currentTab);

        // Update Cognitive Load Indicator
        if (currentTab === 'pending') {
            let cognitiveLoad = 0;
            filteredTasks.forEach(t => cognitiveLoad += (t.difficulty === 'hard' ? 3 : 1));
            const loadBadge = document.getElementById('cognitive-load-badge');
            if (loadBadge) {
                if (cognitiveLoad > 10) {
                    loadBadge.textContent = 'High'; 
                    loadBadge.style.background = 'var(--danger-color)';
                } else if (cognitiveLoad > 5) {
                    loadBadge.textContent = 'Medium'; 
                    loadBadge.style.background = '#f59e0b';
                } else {
                    loadBadge.textContent = 'Low'; 
                    loadBadge.style.background = 'var(--success-color)';
                }
            }
        }

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <svg style="margin-bottom: 1rem; color: var(--text-secondary);" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <p>No ${currentTab} tasks found.</p>
                </div>
            `;
            return;
        }

        // Sort pending by deadline Ascending, completed by deadline Descending
        const sortedTasks = [...filteredTasks].sort((a, b) => {
            if (currentTab === 'pending') {
                return new Date(a.deadline) - new Date(b.deadline);
            } else {
                return new Date(b.deadline) - new Date(a.deadline);
            }
        });
        
        // Group by Difficulty
        const hardTasks = sortedTasks.filter(t => t.difficulty === 'hard');
        const easyTasks = sortedTasks.filter(t => t.difficulty !== 'hard');

        let html = '';

        const generateTaskHTML = (task) => {
            const timeStr = calculateTimeRemaining(task.deadline);
            const isOverdue = timeStr === "Overdue";
            const timeClass = isOverdue && currentTab === 'pending' ? "time-overdue" : "time-remaining";
            
            const dateObj = new Date(task.deadline);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

            let actionsHtml = '';
            if (currentTab === 'pending') {
                actionsHtml = `
                    <button class="btn-icon complete-btn" data-id="${task.id}" title="Mark Complete" style="color:var(--success-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                    <button class="btn-icon edit-btn" data-id="${task.id}" title="Edit Task" style="color:var(--accent-color);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${task.id}" title="Delete Task" style="color:var(--danger-color);">
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
                <div class="task-item" data-id="${task.id}" style="${currentTab === 'completed' ? 'opacity:0.8;' : ''}">
                    <div class="task-content">
                        <div class="task-header">
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                            <span class="priority-badge" style="background: var(--glass-border); color: var(--text-secondary); margin-left: 6px;">${task.difficulty === 'hard' ? 'Hard' : 'Easy'}</span>
                            <div class="task-title" style="margin-left: 8px; ${currentTab === 'completed' ? 'text-decoration: line-through; color: var(--text-secondary);' : ''}">${task.title}</div>
                        </div>
                        <div class="task-desc" style="${currentTab === 'completed' ? 'text-decoration: line-through;' : ''}">${task.description || 'No description provided.'}</div>
                        
                        <div class="task-meta">
                            <span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${dateStr}
                            </span>
                            <span class="${currentTab === 'pending' ? timeClass : 'time-remaining'}" style="${currentTab === 'completed' ? 'color: var(--success-color);' : ''}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${currentTab === 'completed' ? 'Completed' : timeStr}
                            </span>
                        </div>
                    </div>
                    
                    <div class="task-actions" style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
                        ${actionsHtml}
                    </div>
                </div>
            `;
        };

        if (hardTasks.length > 0) {
            html += `<h4 style="margin: 0.5rem 0 1rem; color: var(--accent-color); display:flex; align-items:center; gap:8px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Hard Tasks
                     </h4>`;
            html += hardTasks.map(generateTaskHTML).join('');
        }

        if (easyTasks.length > 0) {
            html += `<h4 style="margin: 1.5rem 0 1rem; color: var(--success-color); display:flex; align-items:center; gap:8px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Easy Tasks
                     </h4>`;
            html += easyTasks.map(generateTaskHTML).join('');
        }

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

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                startEditing(id);
            });
        });
    }

    async function updateAIAdvisor(pendingList, tabStatus) {
        const advisorBanner = document.getElementById('ai-advisor-banner');
        const advisorText = document.getElementById('ai-advisor-text');
        
        if (!advisorBanner || tabStatus !== 'pending' || pendingList.length === 0) {
            if (advisorBanner) advisorBanner.style.display = 'none';
            return;
        }

        try {
            const currentUser = getCurrentUser();
            const res = await fetch(`http://localhost:5000/api/intelligence/recommendation/next?userId=${currentUser}`);
            if (!res.ok) throw new Error('Failed to fetch recommendation');
            
            const data = await res.json();
            
            if (!data.recommendation) {
                advisorBanner.style.display = 'none';
                return;
            }

            advisorBanner.style.display = 'flex';
            const confidencePercent = Math.round(data.confidenceScore * 100);
            
            advisorText.innerHTML = `<span style="display:inline-block; margin-right:6px; padding:2px 6px; border-radius:4px; font-size:0.75rem; background:rgba(139,92,246,0.2); font-weight:bold;">${confidencePercent}% Confidence</span> <span style="color: var(--text-primary);">${data.reasoning}</span>`;
        } catch (error) {
            console.error('Error fetching AI recommendation:', error);
            advisorBanner.style.display = 'none';
        }
    }

    function startEditing(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editingTaskId = id;
        
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        if(document.getElementById('task-difficulty')) {
            document.getElementById('task-difficulty').value = task.difficulty || 'easy';
        }
        if(document.getElementById('task-recurring')) {
            document.getElementById('task-recurring').value = task.recurring || 'none';
        }
        document.getElementById('task-deadline').value = task.deadline || '';

        // Update UI for editing
        document.getElementById('submit-task-btn').textContent = 'Save Changes';
        document.getElementById('cancel-edit-btn').style.display = 'block';
        
        // Scroll up to the form
        document.querySelector('.task-form-panel').scrollIntoView({ behavior: 'smooth' });
    }

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editingTaskId = null;
            taskForm.reset();
            document.getElementById('submit-task-btn').textContent = 'Add Task';
            cancelEditBtn.style.display = 'none';
            if (deadlineInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
                deadlineInput.value = tomorrow.toISOString().slice(0, 16);
            }
        });
    }

    const notifiedTasks = new Set();

    function checkReminders() {
        const now = new Date().getTime();
        tasks.filter(t => t.status !== 'completed').forEach(task => { // only remind pending
            const target = new Date(task.deadline).getTime();
            const distance = target - now;
            
            // Due within 24 hours
            if (distance > 0 && distance < (24 * 60 * 60 * 1000) && !notifiedTasks.has(task.id)) {
                showNotification('Task Due Soon', `"${task.title}" is due in ${calculateTimeRemaining(task.deadline)}.`);
                notifiedTasks.add(task.id);
            } else if (distance < 0 && !notifiedTasks.has(task.id + '_overdue')) {
                 showNotification('Task Overdue', `"${task.title}" is overdue!`);
                 notifiedTasks.add(task.id + '_overdue');
            }
        });
    }

    window.showNotification = function(title, message) {
        let container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="notif-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div class="notif-content" style="flex: 1;">
                <div class="notif-title" style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-primary);">${title}</div>
                <div class="notif-desc" style="font-size: 0.85rem; color: var(--text-secondary);">${message}</div>
            </div>
            <button type="button" class="btn-icon notif-close" aria-label="Close notification">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Setup close button
        const closeBtn = toast.querySelector('.notif-close');
        closeBtn.addEventListener('click', () => dismissToast(toast));

        // Auto dismiss after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) dismissToast(toast);
        }, 6000);
    };

    function dismissToast(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentElement) toast.remove();
        });
    }

    function startTimer() {
        if (renderInterval) clearInterval(renderInterval);
        renderTasks(); // Initial render
        checkReminders(); // Initial check
        renderInterval = setInterval(() => {
            renderTasks();
            checkReminders();
        }, 60000); // Re-render every minute to update remaining time
    }

    function addTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        let priority = document.getElementById('task-priority').value;
        const difficulty = document.getElementById('task-difficulty') ? document.getElementById('task-difficulty').value : 'easy';
        const recurring = document.getElementById('task-recurring') ? document.getElementById('task-recurring').value : 'none';
        const deadline = document.getElementById('task-deadline').value;

        if (!title || !deadline) return;

        // Smart Priority Assignment
        const deadlineTime = new Date(deadline).getTime();
        if (priority !== 'high' && (deadlineTime - new Date().getTime()) < (24 * 60 * 60 * 1000)) {
            priority = 'high';
            showNotification('Smart Priority', 'Task bumped to High priority due to close deadline.');
        }

        if (editingTaskId) {
            // Update existing task
            const idx = tasks.findIndex(t => t.id === editingTaskId);
            if(idx !== -1) {
                tasks[idx].title = title;
                tasks[idx].description = desc;
                tasks[idx].priority = priority;
                tasks[idx].difficulty = difficulty;
                tasks[idx].recurring = recurring;
                tasks[idx].deadline = deadline;
            }
            editingTaskId = null;
            document.getElementById('submit-task-btn').textContent = 'Add Task';
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        } else {
            // Existing add logic
            const newTask = {
                id: Date.now().toString(),
                title,
                description: desc,
                priority,
                difficulty,
                recurring,
                deadline,
                createdAt: new Date().toISOString(),
                status: 'pending' // Default to pending
            };
            tasks.push(newTask);
        }

        saveTasks(tasks);
        
        taskForm.reset();
        
        // Reset datetime field to tomorrow
        if (deadlineInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
            deadlineInput.value = tomorrow.toISOString().slice(0, 16);
        }

        renderTasks();
        checkReminders();
    }

    function changeTaskStatus(id, newStatus) {
        const idx = tasks.findIndex(t => t.id === id);
        if(idx !== -1) {
            const oldStatus = tasks[idx].status;
            tasks[idx].status = newStatus;
            
            if (newStatus === 'completed' && oldStatus !== 'completed') {
                tasks[idx].completedAt = new Date().toISOString();
                const xpPoints = tasks[idx].difficulty === 'hard' ? 20 : 10;
                // dateStr used for streak calculation
                updateUserXP(xpPoints, tasks[idx].completedAt).then(profile => {
                    if (profile) showNotification('XP Gained!', `+${xpPoints} XP. You are level ${profile.level}. Current Streak: ${profile.streakDays}🔥`);
                });
                
                // Recurring task spawn logic
                if (tasks[idx].recurring && tasks[idx].recurring !== 'none') {
                    const nextTask = { 
                        ...tasks[idx], 
                        id: Date.now().toString() + Math.floor(Math.random()*1000), 
                        status: 'pending', 
                        completedAt: null, 
                        title: tasks[idx].title.replace('[Rescheduled] ', '') 
                    };
                    let dDate = new Date(nextTask.deadline);
                    dDate.setDate(dDate.getDate() + (nextTask.recurring === 'weekly' ? 7 : 1));
                    nextTask.deadline = dDate.toISOString();
                    tasks.push(nextTask);
                    showNotification('Recurring Task Generated', `Scheduled next occurrence for ${dDate.toLocaleDateString()}`);
                }
            } else if (newStatus === 'pending') {
                tasks[idx].completedAt = null;
            }
            
            saveTasks(tasks);
            renderTasks();
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks(tasks);
        renderTasks();
    }

    if (taskForm) {
        taskForm.addEventListener('submit', addTask);
    }
    
    // --- Mood Suggestion Logic ---
    const moodBtns = document.querySelectorAll('.mood-btn');
    const suggestionBox = document.getElementById('mood-suggestion-box');
    const suggestionText = document.getElementById('mood-suggestion-text');

    function suggestTaskForMood(mood) {
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        if (pendingTasks.length === 0) {
            suggestionBox.style.display = 'block';
            suggestionText.innerHTML = "You have no pending tasks! Enjoy your free time.";
            return;
        }

        // Sort by Priority (High to Low), then Deadline (Closest first)
        const pWeight = { 'high': 3, 'medium': 2, 'low': 1 };
        pendingTasks.sort((a, b) => {
            if (pWeight[b.priority] !== pWeight[a.priority]) {
                return pWeight[b.priority] - pWeight[a.priority]; 
            }
            return new Date(a.deadline) - new Date(b.deadline); 
        });

        let recommendedTask = null;
        let message = "";

        if (mood === 'energetic') {
            // Find hardest task, or default to most urgent
            recommendedTask = pendingTasks.find(t => t.difficulty === 'hard') || pendingTasks[0];
            message = `⚡ <strong>You've got great energy!</strong> Let's conquer your biggest challenge right now:<br><span style="color:var(--accent-color); font-weight:700; display:inline-block; margin-top:8px;">${recommendedTask.title}</span>`;
        } else if (mood === 'focused') {
            // Pure logic: Highest priority and closest deadline
            recommendedTask = pendingTasks[0]; 
            message = `🧠 <strong>Let's get down to business.</strong> The most logical and urgent task to tackle is:<br><span style="color:var(--accent-color); font-weight:700; display:inline-block; margin-top:8px;">${recommendedTask.title}</span>`;
        } else if (mood === 'stressed') {
            // Find easiest and lowest priority task to relieve pressure
            recommendedTask = pendingTasks.find(t => t.difficulty === 'easy' && t.priority !== 'high') || pendingTasks.find(t => t.difficulty === 'easy') || pendingTasks[0];
            message = `😮‍💨 <strong>Take a deep breath.</strong> You might be overwhelmed. Let's build momentum with a quick win:<br><span style="color:var(--accent-color); font-weight:700; display:inline-block; margin-top:8px;">${recommendedTask.title}</span>`;
        } else if (mood === 'tired') {
            // Find any easy task
            recommendedTask = pendingTasks.find(t => t.difficulty === 'easy') || pendingTasks[0];
            message = `🔋 <strong>Running on low battery?</strong> Take it easy right now. Try knocking out this low-brainpower task:<br><span style="color:var(--accent-color); font-weight:700; display:inline-block; margin-top:8px;">${recommendedTask.title}</span>`;
        }

        suggestionBox.style.display = 'block';
        suggestionBox.classList.remove('animate-fade-in'); 
        void suggestionBox.offsetWidth; // trigger reflow to reset CSS animation
        suggestionBox.classList.add('animate-fade-in');
        suggestionText.innerHTML = message;
    }

    if (moodBtns) {
        moodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                moodBtns.forEach(b => {
                    b.style.boxShadow = 'none';
                    b.style.transform = 'translateY(0)';
                });
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                
                const mood = e.currentTarget.getAttribute('data-mood');
                suggestTaskForMood(mood);
            });
        });
    }

    // Start rendering the task list
    startTimer();
});
