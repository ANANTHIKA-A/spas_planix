import { initApp, getTasks, saveTasks, calculateTimeRemaining, API_BASE_URL } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', async () => {
    // Shared state
    window.tasks = await getTasks();
    const now = new Date().getTime();

    // Check if on Analysis Page
    const isAnalysisPage = window.location.pathname.includes('analysis.html');
    if (isAnalysisPage) {
        initAnalysisPage();
    }
});

async function initAnalysisPage() {
    // Elements
    const statTotal = document.getElementById('stat-total');
    const statPrediction = document.getElementById('stat-prediction');
    const statOverdue = document.getElementById('stat-overdue');
    const priorityDist = document.getElementById('priority-distribution');
    const upcomingContainer = document.getElementById('upcoming-tasks');
    const burnoutWarningEl = document.getElementById('burnout-warning');
    const prodScoreEl = document.getElementById('productivity-score-display');
    const effScoreEl = document.getElementById('efficiency-score-display');
    const missedWarningEl = document.getElementById('missed-deadline-warning');
    const predictMissCountEl = document.getElementById('predict-miss-count');

    const tasks = window.tasks || await getTasks();
    const now = new Date().getTime();

    function calculateStats() {
        if (!statTotal) return;

        let overdueCount = 0;
        let soonCount = 0; // Due within 24h
        const priorityCounts = { high: 0, medium: 0, low: 0 };
        
        let recentCompletions = 0;
        let hardCompletions = 0;

        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        const sortedTasks = [...pendingTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        sortedTasks.forEach(task => {
            const target = new Date(task.deadline).getTime();
            const distance = target - now;

            if (distance < 0) {
                overdueCount++;
            }

            if (priorityCounts[task.priority] !== undefined) {
                priorityCounts[task.priority]++;
            }
        });
        
        // Calculate prediction and burnout based on completed tasks
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
        completedTasks.forEach(t => {
            const completedTime = new Date(t.completedAt).getTime();
            const daysSinceCompletion = (now - completedTime) / (1000 * 60 * 60 * 24);
            
            // Tasks completed in last 3 days
            if (daysSinceCompletion <= 3) {
                recentCompletions++;
                if (t.difficulty === 'hard') hardCompletions++;
            }
        });
        
        // Prediction: Weekly completions based on 3-day run rate
        const weeklyPrediction = Math.round((recentCompletions / 3) * 7) || 0;

        // Advanced Analytics Tasks
        let prodScore = 0;
        completedTasks.forEach(t => {
            let base = t.difficulty === 'hard' ? 2.5 : 1.0;
            if (t.priority === 'high') base *= 1.5;
            else if (t.priority === 'medium') base *= 1.2;
            prodScore += base;
        });

        if (prodScoreEl) prodScoreEl.textContent = Math.round(prodScore * 10) / 10;
        
        if (effScoreEl) {
            const ratio = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
            effScoreEl.textContent = Math.round(ratio) + '%';
        }

        // Predictive Analytics: Missed deadline estimation
        let tasksDueNext7Days = 0;
        pendingTasks.forEach(task => {
            const distance = new Date(task.deadline).getTime() - now;
            if (distance > 0 && distance < (7 * 24 * 60 * 60 * 1000)) {
                tasksDueNext7Days++;
            }
        });

        if (missedWarningEl && predictMissCountEl) {
            const riskCount = tasksDueNext7Days - weeklyPrediction;
            if (riskCount > 0) {
                missedWarningEl.style.display = 'flex';
                predictMissCountEl.textContent = riskCount;
            } else {
                missedWarningEl.style.display = 'none';
            }
        }

        // Burnout Warning: > 10 tasks or > 5 hard tasks in 3 days
        if (burnoutWarningEl) {
            if (recentCompletions >= 10 || hardCompletions >= 5) {
                burnoutWarningEl.style.display = 'flex';
            } else {
                burnoutWarningEl.style.display = 'none';
            }
        }

        // Update top stats
        if (statTotal) statTotal.textContent = pendingTasks.length;
        if (statPrediction) statPrediction.textContent = weeklyPrediction;
        if (statOverdue) statOverdue.textContent = overdueCount;

        // Eisenhower Matrix
        const q1 = document.getElementById('matrix-q1');
        const q2 = document.getElementById('matrix-q2');
        const q3 = document.getElementById('matrix-q3');
        const q4 = document.getElementById('matrix-q4');
        if (q1 && q2 && q3 && q4) {
             pendingTasks.forEach(t => {
                  const urgent = t.deadline ? ((new Date(t.deadline).getTime() - now) < (24 * 60 * 60 * 1000)) : false;
                  const important = t.priority === 'high';
                  
                  const taskCard = `<div style="background: var(--bg-color); padding: 8px; border-radius:4px; margin-bottom:6px; font-size:0.85rem; border:1px solid var(--glass-border); color: var(--text-primary); cursor:pointer;" title="Score: ${t.impactScore || 0}">${t.title}</div>`;
                  
                  if (urgent && important) q1.insertAdjacentHTML('beforeend', taskCard);
                  else if (!urgent && important) q2.insertAdjacentHTML('beforeend', taskCard);
                  else if (urgent && !important) q3.insertAdjacentHTML('beforeend', taskCard);
                  else q4.insertAdjacentHTML('beforeend', taskCard);
             });
        }

        // Render Priority Distribution
        const maxTasks = pendingTasks.length || 1; // Prevent division by zero
        priorityDist.innerHTML = `
            <div class="priority-item">
                <span style="width: 60px; font-weight: 500;">High</span>
                <div class="priority-bar-container">
                    <div class="priority-bar high" style="width: ${(priorityCounts.high / maxTasks) * 100}%"></div>
                </div>
                <span style="width: 30px; text-align: right;">${priorityCounts.high}</span>
            </div>
            <div class="priority-item">
                <span style="width: 60px; font-weight: 500;">Medium</span>
                <div class="priority-bar-container">
                    <div class="priority-bar medium" style="width: ${(priorityCounts.medium / maxTasks) * 100}%"></div>
                </div>
                <span style="width: 30px; text-align: right;">${priorityCounts.medium}</span>
            </div>
            <div class="priority-item">
                <span style="width: 60px; font-weight: 500;">Low</span>
                <div class="priority-bar-container">
                    <div class="priority-bar low" style="width: ${(priorityCounts.low / maxTasks) * 100}%"></div>
                </div>
                <span style="width: 30px; text-align: right;">${priorityCounts.low}</span>
            </div>
        `;

        // Render Upcoming Array (next 3 tasks)
        const upcomingTasks = sortedTasks.filter(t => (new Date(t.deadline).getTime() - now) > 0).slice(0, 3);
        
        if (upcomingTasks.length === 0) {
            upcomingContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No upcoming tasks.</p>';
        } else {
            upcomingContainer.innerHTML = upcomingTasks.map(task => {
                const timeStr = calculateTimeRemaining(task.deadline);
                const dateStr = new Date(task.deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
                
                return `
                    <div class="timeline-item">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${task.title}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
                            <span>${dateStr}</span>
                            <span style="color: var(--accent-color); font-weight: 500;">${timeStr}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        // Fetch and Render Predictive Energy Curve
        const user = localStorage.getItem('spas_user') || 'default_user';
        fetch(`${API_BASE_URL}/api/intelligence/analytics/predictive?userId=${user}`)
            .then(res => res.json())
            .then(data => {
                const ctx = document.getElementById('energyProdChart');
                if (ctx && data.efficiencyCurve) {
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    const textColor = isDark ? '#ffffff' : '#1f2937';
                    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                            datasets: [{
                                label: 'Optimal Productivity Window (Base Energy)',
                                data: data.efficiencyCurve,
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#8b5cf6'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { labels: { color: textColor } }
                            },
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    max: 10,
                                    grid: { color: gridColor },
                                    ticks: { color: textColor }
                                },
                                x: {
                                    grid: { color: gridColor },
                                    ticks: { color: textColor }
                                }
                            }
                        }
                    });
                }
            }).catch(console.error);
    }

    calculateStats();
}
