import { initApp, getTasks } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');

    let currentDate = new Date();
    const tasks = await getTasks();

    function renderCalendar() {
        if (!calendarGrid || !currentMonthEl) return;
        
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;

        // Add Day Headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day-header';
            dayEl.textContent = day;
            calendarGrid.appendChild(dayEl);
        });

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const todayDate = new Date();
        const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;

        // Add empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyEl);
        }

        // Add days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            
            const isToday = isCurrentMonth && i === todayDate.getDate();
            
            let dayHtml = `<div class="day-number ${isToday ? 'today' : ''}">${i}</div>`;

            // Filter tasks for this day
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.deadline);
                return taskDate.getDate() === i && 
                       taskDate.getMonth() === month && 
                       taskDate.getFullYear() === year;
            });

            // Add task chips
            dayTasks.forEach(task => {
                const timeStr = new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                dayHtml += `
                    <div class="calendar-task ${task.priority}" title="${task.title} - ${timeStr}">
                        ${timeStr} ${task.title}
                    </div>
                `;
            });

            dayEl.innerHTML = dayHtml;
            dayEl.style.cursor = 'pointer';
            dayEl.addEventListener('click', () => {
                showDayPlanner(i, month, year, dayTasks);
            });
            calendarGrid.appendChild(dayEl);
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar();
        });
    }

    function showDayPlanner(day, month, year, dayTasks) {
        const modal = document.getElementById('day-planner-modal');
        const title = document.getElementById('planner-date-title');
        const timeline = document.getElementById('day-planner-timeline');
        
        if (!modal || !title || !timeline) return;

        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        
        title.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" style="margin-right: 8px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${dateStr}`;

        if (dayTasks.length === 0) {
            timeline.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding: 2rem 0;">No tasks scheduled for this day.</p>`;
        } else {
            // Sort by time
            dayTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            
            let timelineHTML = `<div style="position:relative; margin-left:14px; padding-left:20px; border-left:2px solid var(--glass-border);">`;
            
            dayTasks.forEach(task => {
                const timeStr = new Date(task.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const isCompleted = task.status === 'completed';
                
                timelineHTML += `
                    <div style="position:relative; margin-bottom: 24px; ${isCompleted ? 'opacity: 0.6;' : ''}">
                        <div style="position:absolute; left:-27px; top:0; width:12px; height:12px; border-radius:50%; background:${isCompleted ? 'var(--success-color)' : 'var(--accent-color)'}; border:2px solid var(--bg-color);"></div>
                        <div style="font-size: 0.8rem; color:var(--text-secondary); font-weight:600; margin-bottom:4px;">${timeStr}</div>
                        <div style="background: rgba(255, 255, 255, 0.4); border: 1px solid var(--glass-border); border-radius:8px; padding:12px;">
                            <span class="priority-badge priority-${task.priority}" style="margin-right:8px;">${task.priority}</span>
                            <strong style="color:var(--text-primary); font-size:0.95rem; ${isCompleted ? 'text-decoration: line-through;' : ''}">${task.title}</strong>
                            ${task.description ? `<p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary);">${task.description}</p>` : ''}
                        </div>
                    </div>
                `;
            });
            
            timelineHTML += `</div>`;
            timeline.innerHTML = timelineHTML;
        }
        
        modal.style.display = 'flex';
    }

    const closeDayPlannerBtn = document.getElementById('close-day-planner');
    if (closeDayPlannerBtn) {
        closeDayPlannerBtn.addEventListener('click', () => {
            const modal = document.getElementById('day-planner-modal');
            if (modal) modal.style.display = 'none';
        });
    }

    renderCalendar();
});
