import { initApp, getTasks } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const plannerTimeline = document.getElementById('planner-timeline');
    const startFocusBtn = document.getElementById('start-focus-btn');
    const simulateDelayBtn = document.getElementById('simulate-delay-btn');
    
    let tasks = await getTasks();
    let delayOffsetHours = 0;

    function formatAMPM(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    }

    function generateDailySchedule() {
        if (!plannerTimeline) return;
        
        const pendingTasks = tasks.filter(t => t.status === 'pending').map(t => ({...t}));
        if (pendingTasks.length === 0) {
            plannerTimeline.innerHTML = `
                <div style="text-align: center; padding: 4rem 1rem;">
                    <svg style="color: var(--success-color); margin-bottom: 1rem;" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <h3 style="color: var(--text-primary); font-size: 1.5rem; margin-bottom: 0.5rem;">All Caught Up!</h3>
                    <p style="color:var(--text-secondary); font-size: 1.1rem;">You have no pending tasks to schedule.</p>
                </div>
            `;
            return;
        }

        // Energy Depletion Sorting: Hard tasks get assigned to High Energy morning blocks first
        const pWeight = { 'high': 1, 'medium': 2, 'low': 3 };
        const eWeight = { 'hard': 1, 'easy': 2 };
        pendingTasks.sort((a, b) => {
            if (eWeight[a.difficulty] !== eWeight[b.difficulty]) {
                return eWeight[a.difficulty] - eWeight[b.difficulty];
            }
            if (pWeight[a.priority] !== pWeight[b.priority]) {
                return pWeight[a.priority] - pWeight[b.priority];
            }
            return new Date(a.deadline) - new Date(b.deadline);
        });

        // Start scheduling 15 mins from now + any simulation offsets
        let currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + 15 + (delayOffsetHours * 60));
        // Round to nearest 5 mins for clean look
        currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 5) * 5);

        let totalMins = pendingTasks.reduce((acc, task) => acc + (task.difficulty === 'hard' ? 90 : 30), 0);
        let timelineHTML = '';
        
        if (totalMins > 480) {
             timelineHTML += `<div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger-color); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; color: var(--danger-color); display:flex; align-items:center; gap: 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span><strong>Workload Overload Warning:</strong> You have scheduled ${Math.round(totalMins/60)} hours of tasks today. Consider rescheduling to prevent burnout.</span>
             </div>`;
        }

        timelineHTML += `<div style="position:relative; margin-left:14px; padding-left:24px; border-left:2px solid var(--glass-border);">`;

        pendingTasks.forEach((task, index) => {
            const durationMins = task.difficulty === 'hard' ? 90 : 30; // 90 mins for Hard, 30 for Easy
            
            const startStr = formatAMPM(currentTime);
            
            // Advance time for task duration
            currentTime.setMinutes(currentTime.getMinutes() + durationMins);
            const endStr = formatAMPM(currentTime);

            timelineHTML += `
                <div style="position:relative; margin-bottom: 32px;">
                    <div style="position:absolute; left:-32px; top:0; width:14px; height:14px; border-radius:50%; background:var(--accent-color); border:2px solid var(--bg-color);"></div>
                    <div style="font-size: 0.9rem; color:var(--text-secondary); font-weight:600; margin-bottom:8px;">${startStr} - ${endStr} <span style="font-weight:400;">(${durationMins}m)</span></div>
                    <div style="background: rgba(255,255,255,0.4); border: 1px solid var(--glass-border); border-radius:12px; padding:16px; transition: transform 0.2s;">
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                            <span class="priority-badge" style="background:var(--glass-bg); border:1px solid var(--glass-border);">${task.difficulty === 'hard' ? 'Hard' : 'Easy'}</span>
                        </div>
                        <strong style="color:var(--text-primary); font-size:1.1rem; display:block; margin-bottom: 4px;">${task.title}</strong>
                        ${task.description ? `<p style="color:var(--text-secondary); font-size:0.95rem;">${task.description}</p>` : ''}
                    </div>
                </div>
            `;
            
            // Insert 10 min break if it's not the last task
            if (index < pendingTasks.length - 1) {
                const breakStart = formatAMPM(currentTime);
                currentTime.setMinutes(currentTime.getMinutes() + 10);
                const breakEnd = formatAMPM(currentTime);
                
                timelineHTML += `
                    <div style="position:relative; margin-bottom: 32px;">
                        <div style="position:absolute; left:-30px; top:2px; width:10px; height:10px; border-radius:50%; background:var(--success-color); border:2px solid var(--bg-color);"></div>
                        <div style="font-size: 0.9rem; color:var(--success-color); font-weight:600; display:flex; align-items:center; gap: 6px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> 
                            ${breakStart} - ${breakEnd} (10m Break)
                        </div>
                    </div>
                `;
            }
        });

        timelineHTML += `</div>`;
        plannerTimeline.innerHTML = timelineHTML;
    }

    generateDailySchedule();
    
    // Quick link to Focus Timer
    if (startFocusBtn) {
        startFocusBtn.addEventListener('click', () => {
            window.location.href = '/focus.html';
        });
    }

    if (simulateDelayBtn) {
        simulateDelayBtn.addEventListener('click', () => {
            delayOffsetHours += 2;
            generateDailySchedule();
            // Show toast if fn exists
            if (window.showNotification) window.showNotification('Simulation', `Schedule delayed by ${delayOffsetHours} hours.`);
        });
    }
});
