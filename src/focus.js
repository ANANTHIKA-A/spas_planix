import { initApp } from './shared.js';

// Setup basic requirements (Theme, Auth)
initApp();

document.addEventListener('DOMContentLoaded', () => {
    // Basic shared notification method (simpler inline version for focus)
    function showNotification(title, message) {
        let container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'notification-toast show';
        toast.innerHTML = `
            <div class="notif-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="notif-content" style="flex: 1;">
                <div class="notif-title" style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px; color: var(--text-primary);">${title}</div>
                <div class="notif-desc" style="font-size: 0.85rem; color: var(--text-secondary);">${message}</div>
            </div>
        `;
        container.appendChild(toast);
        
        // Notify via audio beep
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentElement) toast.remove(); }, 400);
        }, 8000);
    }

    const timeDisplay = document.getElementById('time-display');
    const toggleBtn = document.getElementById('btn-toggle');
    const resetBtn = document.getElementById('btn-reset');
    const switchStudy = document.getElementById('switch-study');
    const switchBreak = document.getElementById('switch-break');
    
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    const btnText = document.getElementById('btn-text');
    const timerRing = document.getElementById('timer-ring');
    const modeText = document.getElementById('mode-text');
    
    const studyInput = document.getElementById('study-input');
    const breakInput = document.getElementById('break-input');

    let STUDY_TIME = (parseInt(studyInput.value) || 25) * 60;
    let BREAK_TIME = (parseInt(breakInput.value) || 5) * 60;
    
    let currentTotalTime = STUDY_TIME;
    let timeRemaining = currentTotalTime;
    let timerInterval = null;
    let isRunning = false;
    let currentMode = 'study'; // 'study' or 'break'

    function updateDisplay(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const timeStr = `${m}:${s}`;
        timeDisplay.textContent = timeStr;
        
        let prefix = currentMode === 'study' ? '🧠 Study' : '☕ Break';
        document.title = `(${timeStr}) ${prefix} - SPAS`;
    }

    function switchMode(mode) {
        if (isRunning) toggleTimer(); // Pause if running
        
        STUDY_TIME = (parseInt(studyInput.value) || 25) * 60;
        BREAK_TIME = (parseInt(breakInput.value) || 5) * 60;
        
        switchStudy.textContent = `Study (${parseInt(studyInput.value) || 25}m)`;
        switchBreak.textContent = `Break (${parseInt(breakInput.value) || 5}m)`;
        
        currentMode = mode;
        if (mode === 'study') {
            switchStudy.classList.add('active');
            switchBreak.classList.remove('active');
            timerRing.className = 'timer-circle study-mode';
            modeText.textContent = 'Study Focus';
            currentTotalTime = STUDY_TIME;
        } else {
            switchBreak.classList.add('active');
            switchStudy.classList.remove('active');
            timerRing.className = 'timer-circle break-mode';
            modeText.textContent = 'Short Break';
            currentTotalTime = BREAK_TIME;
        }
        
        timeRemaining = currentTotalTime;
        updateDisplay(timeRemaining);
    }

    function toggleTimer() {
        if (isRunning) {
            // Pause
            clearInterval(timerInterval);
            isRunning = false;
            
            toggleBtn.className = 'btn-control btn-play';
            btnText.textContent = 'Resume';
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
        } else {
            // Play
            isRunning = true;
            toggleBtn.className = 'btn-control btn-pause';
            btnText.textContent = 'Pause';
            iconPlay.style.display = 'none';
            iconPause.style.display = 'block';
            
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateDisplay(timeRemaining);
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    
                    // Toggle to opposite mode automatically
                    if (currentMode === 'study') {
                        showNotification('Focus Session Complete!', 'Great work! Take a 5 minute break to recharge.');
                        pingFatigue(STUDY_TIME / 60, activeGuidedTask); // Update fatigue at backend
                        switchMode('break');
                    } else {
                        showNotification('Break is Over!', 'Ready to get back to work? Start your next focus session.');
                        switchMode('study');
                    }
                }
            }, 1000);
        }
    }

    function resetTimer() {
        if (isRunning) toggleTimer();
        STUDY_TIME = (parseInt(studyInput.value) || 25) * 60;
        BREAK_TIME = (parseInt(breakInput.value) || 5) * 60;
        switchStudy.textContent = `Study (${parseInt(studyInput.value) || 25}m)`;
        switchBreak.textContent = `Break (${parseInt(breakInput.value) || 5}m)`;
        
        currentTotalTime = currentMode === 'study' ? STUDY_TIME : BREAK_TIME;
        timeRemaining = currentTotalTime;
        updateDisplay(timeRemaining);
        btnText.textContent = 'Start';
    }
    
    if (studyInput) studyInput.addEventListener('change', () => { if (!isRunning) resetTimer(); });
    if (breakInput) breakInput.addEventListener('change', () => { if (!isRunning) resetTimer(); });

    if (switchStudy) switchStudy.addEventListener('click', () => { if (currentMode !== 'study') switchMode('study'); });
    if (switchBreak) switchBreak.addEventListener('click', () => { if (currentMode !== 'break') switchMode('break'); });
    
    if (toggleBtn) toggleBtn.addEventListener('click', toggleTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    // Guided Workflow Logic
    const btnFetchGuided = document.getElementById('btn-fetch-guided');
    const guidedCard = document.getElementById('guided-task-card');
    const displayTitle = document.getElementById('guided-task-title');
    const displayReason = document.getElementById('guided-task-reason');
    const btnCompleteGuided = document.getElementById('btn-complete-guided');
    
    let activeGuidedTask = null;

    if (btnFetchGuided) {
        btnFetchGuided.addEventListener('click', async () => {
            try {
                const user = localStorage.getItem('spas_user') || 'default_user';
                const res = await fetch(`http://localhost:5000/api/intelligence/recommendation/next?userId=${user}`);
                const data = await res.json();
                
                if (data && data.recommendation) {
                    activeGuidedTask = data.recommendation;
                    btnFetchGuided.style.display = 'none';
                    guidedCard.style.display = 'block';
                    displayTitle.textContent = activeGuidedTask.title;
                    displayReason.innerHTML = `<strong>Why this?</strong> ${data.reasoning}`;
                    
                    // Auto-start study timer
                    if (!isRunning && currentMode === 'study') {
                        toggleTimer();
                    }
                } else {
                    showNotification('No tasks', 'You have no pending tasks to perform.');
                }
            } catch (err) {
                 console.error(err);
                 showNotification('Error', 'Unable to fetch guided workflow.');
            }
        });
    }

    if (btnCompleteGuided) {
        btnCompleteGuided.addEventListener('click', async () => {
             if (!activeGuidedTask) return;
             try {
                  const user = localStorage.getItem('spas_user') || 'default_user';
                  const tRes = await fetch(`http://localhost:5000/api/tasks?userId=${user}`);
                  const allTasks = await tRes.json();
                  const targetList = allTasks.filter(t => t.id === activeGuidedTask.id);
                  if (targetList.length) {
                      const updatedTask = { ...targetList[0], status: 'completed', completedAt: new Date().toISOString() };
                      await fetch(`http://localhost:5000/api/tasks/${activeGuidedTask.id}?userId=${user}`, {
                          method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedTask)
                      });
                      showNotification('Success', 'Guided task marked completed!');
                  }
                  
                  activeGuidedTask = null;
                  guidedCard.style.display = 'none';
                  btnFetchGuided.style.display = 'flex';
                  btnFetchGuided.textContent = 'Fetch Next Task';
             } catch(err) {
                 console.error(err);
             }
        });
    }

    // Ping fatigue
    async function pingFatigue(duration, task) {
         try {
             const user = localStorage.getItem('spas_user') || 'default_user';
             if (!user || user === 'default_user') return;
             let intensity = 5;
             if (task && task.difficulty === 'hard') intensity = 8;
             if (task && task.difficulty === 'easy') intensity = 3;

             await fetch('http://localhost:5000/api/intelligence/fatigue/ping', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ userId: user, activeDuration: duration, effortIntensity: intensity })
             });
         } catch(e) { }
    }

    // Wrap toggleTimer internally to know when a session ends naturally
    const originalToggleTimer = toggleTimer;
    toggleTimer = function() {
        if (!isRunning) {
            // we are starting
             originalToggleTimer();
        } else {
            // we are pausing...
             originalToggleTimer();
        }
    };

    // Modified interval inside toggleTimer needs access:
    // It's inside a closure, so we inject pingFatigue at complete time by replacing the clear interval logic.


    // Initial render
    updateDisplay(timeRemaining);
});
