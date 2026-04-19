import { initApp } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const groupConfirm = document.getElementById('group-confirm-password');
    const groupGmail = document.getElementById('group-gmail');
    const submitBtn = document.getElementById('submit-btn');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const gmailInput = document.getElementById('gmail');
    const generalError = document.getElementById('error-general');

    function clearErrors() {
        document.querySelectorAll('.form-group.error').forEach(el => el.classList.remove('error'));
        if (generalError) generalError.textContent = '';
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    function showError(groupId, message) {
        if (groupId === 'general') {
            if (generalError) {
                generalError.textContent = message;
                generalError.parentElement.classList.add('error');
            }
            return;
        }
        const group = document.getElementById(`group-${groupId}`);
        if (group) {
            group.classList.add('error');
            const msgEl = document.getElementById(`error-${groupId}`);
            if (msgEl) msgEl.textContent = message;
        }
    }

    // Tab Switching Logic
    function setMode(mode) {
        clearErrors();
        loginForm.setAttribute('data-mode', mode);
        if (mode === 'signup') {
            tabSignup.classList.add('active');
            tabSignin.classList.remove('active');
            groupConfirm.style.display = 'block';
            if (groupGmail) groupGmail.style.display = 'block';
            confirmPasswordInput.setAttribute('required', 'true');
            submitBtn.textContent = 'Sign Up';
        } else {
            tabSignin.classList.add('active');
            tabSignup.classList.remove('active');
            groupConfirm.style.display = 'none';
            if (groupGmail) groupGmail.style.display = 'none';
            confirmPasswordInput.removeAttribute('required');
            submitBtn.textContent = 'Sign In';
        }
    }

    if (tabSignin && tabSignup) {
        tabSignin.addEventListener('click', () => setMode('signin'));
        tabSignup.addEventListener('click', () => setMode('signup'));
    }

    // Helper to get registered users
    function getUsers() {
        return JSON.parse(localStorage.getItem('spas_registered_users') || '{}');
    }

    // Helper to save registered users
    function saveUsers(users) {
        localStorage.setItem('spas_registered_users', JSON.stringify(users));
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();
            
            const mode = loginForm.getAttribute('data-mode') || 'signin';
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = confirmPasswordInput.value;
            const gmail = gmailInput ? gmailInput.value.trim() : '';

            if (!username) {
                showError('username', 'Username is required');
                return;
            }
            if (!password) {
                showError('password', 'Password is required');
                return;
            }
            if (password.length < 6) {
                showError('password', 'Password must be at least 6 characters');
                return;
            }

            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    showError('confirm', 'Passwords do not match');
                    return;
                }
            }

            try {
                const submitOriginalText = submitBtn.textContent;
                submitBtn.textContent = 'Please wait...';
                
                const res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                
                submitBtn.textContent = submitOriginalText;
                
                if (!res.ok) {
                    showError(mode === 'signup' && data.message.includes('taken') ? 'username' : 'password', data.message || 'Authentication failed');
                    return;
                }

                // Temporary hack to keep the google account mock UI populated
                if (mode === 'signup' && gmail) {
                    const users = getUsers();
                    users[username] = { password, gmail };
                    saveUsers(users);
                }

                window.loginSuccess(data.userId, submitBtn);

            } catch (err) {
                submitBtn.textContent = 'Error';
                showError('general', 'Server connection failed. Is the backend running?');
                setTimeout(() => { submitBtn.textContent = mode === 'signup' ? 'Sign Up' : 'Sign In'; }, 2000);
            }
        });
    }

    window.loginSuccess = function(username, btn) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('spas_user', username);
        
        if (btn) {
            // Add a small delay for animation/UX feel
            const originalText = btn.textContent;
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Authenticating...`;
            
            const svg = btn.querySelector('svg');
            let rotate = 0;
            const spin = setInterval(() => {
                rotate += 15;
                if(svg) svg.style.transform = `rotate(${rotate}deg)`;
            }, 30);

            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                clearInterval(spin);
                window.location.href = '/dashboard.html';
            }, 800);
        } else {
            window.location.href = '/dashboard.html';
        }
    }

    const googleBtn = document.getElementById('google-signin-mock-btn');
    const googleModal = document.getElementById('google-mock-modal');
    const closeGoogleModal = document.getElementById('close-google-modal');
    const accountsList = document.getElementById('google-accounts-list');

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const users = getUsers();
            const gmails = [];
            
            for (const [username, data] of Object.entries(users)) {
                if (data.gmail) {
                    gmails.push({ username, email: data.gmail });
                }
            }
            
            accountsList.innerHTML = '';
            if (gmails.length === 0) {
                accountsList.innerHTML = `<div style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; padding: 1rem 0;">No Google accounts found.<br>Sign up with an optional Gmail address first.</div>`;
            } else {
                gmails.forEach(account => {
                    const btn = document.createElement('div');
                    btn.style.cssText = "display: flex; align-items: center; padding: 10px; border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; transition: background 0.2s;";
                    btn.onmouseover = () => btn.style.background = "var(--glass-hover)";
                    btn.onmouseout = () => btn.style.background = "transparent";
                    
                    btn.innerHTML = `
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">
                            ${account.email.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1; overflow: hidden; text-align: left;">
                            <div style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary); margin-bottom: 2px;">${account.username}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${account.email}</div>
                        </div>
                    `;
                    
                    btn.addEventListener('click', () => {
                        googleModal.style.display = 'none';
                        window.loginSuccess(account.username, googleBtn);
                    });
                    
                    accountsList.appendChild(btn);
                });
            }
            
            googleModal.style.display = 'flex';
        });
    }

    if (closeGoogleModal) {
        closeGoogleModal.addEventListener('click', () => {
            googleModal.style.display = 'none';
        });
    }
});
