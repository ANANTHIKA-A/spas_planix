import { initApp, getTasks, getCurrentUser, getUserProfile } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const usernameEl = document.getElementById('profile-username');
    const emailEl = document.getElementById('profile-email');
    const initialEl = document.getElementById('profile-initial');
    const totalStatsEl = document.getElementById('profile-total-tasks');
    const completedStatsEl = document.getElementById('profile-completed-tasks');
    
    // Get user from active session
    const user = getCurrentUser();
    
    // Read the registered users from localStorage to grab the email
    const registeredUsersMap = JSON.parse(localStorage.getItem('spas_registered_users') || '{}');
    
    if (usernameEl) usernameEl.textContent = user;
    if (initialEl) initialEl.textContent = user.charAt(0).toUpperCase();
    
    if (emailEl) {
        if (registeredUsersMap[user] && registeredUsersMap[user].gmail) {
            emailEl.textContent = registeredUsersMap[user].gmail;
        } else {
            emailEl.textContent = "No valid email";
        }
    }
    
    // Compute stats
    const tasks = await getTasks();
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    if (totalStatsEl) totalStatsEl.textContent = tasks.length;
    if (completedStatsEl) completedStatsEl.textContent = completedTasks.length;
    
    // Fetch and render Gamification
    const userProfile = await getUserProfile();
    if (userProfile) {
        const levelEl = document.getElementById('profile-level');
        const xpTextEl = document.getElementById('profile-xp-text');
        const xpBarEl = document.getElementById('profile-xp-bar');
        const badgesEl = document.getElementById('profile-badges');
        const streakEl = document.getElementById('profile-streak');
        
        if (levelEl) levelEl.textContent = userProfile.level;
        if (streakEl) streakEl.textContent = `${userProfile.streakDays}🔥`;
        
        if (xpTextEl && xpBarEl) {
            const currentXp = userProfile.xp;
            const levelBaseXp = (userProfile.level - 1) * 100;
            const nextLevelXp = userProfile.level * 100;
            const xpInLevel = currentXp - levelBaseXp;
            
            xpTextEl.textContent = `${currentXp} / ${nextLevelXp} XP`;
            xpBarEl.style.width = `${(xpInLevel / 100) * 100}%`;
        }
        
        if (badgesEl) {
            if (userProfile.badges && userProfile.badges.length > 0) {
                badgesEl.innerHTML = userProfile.badges.map(b => 
                    `<span style="background: rgba(245, 158, 11, 0.15); color: var(--warning-color); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.85rem; font-weight: 600;">🛡️ ${b}</span>`
                ).join('');
            } else {
                badgesEl.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.85rem;">No badges earned yet. Keep completing tasks!</span>`;
            }
        }
    }
});
