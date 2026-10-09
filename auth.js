import { auth } from './firebase-config.js';
import { 
    signOut, 
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    const userNameDisplay = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Auth Gating Logic: Protect only private personal dashboard
    const enforceAuthGating = (user) => {
        const currentPage = window.location.pathname;
        const isDashboard = currentPage.includes('dashboard.html');

        if (!user && isDashboard) {
            console.log("Dashboard access requires active session. Redirecting to login.");
            window.location.replace('login.html');
            return false;
        }
        return true;
    };

    if (loginBtn) {
        loginBtn.onclick = (e) => {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        };
    }

    // Dropdown Logic - Improved for reliability
    if (userProfile) {
        const dropdown = userProfile.querySelector('.dropdown-content');
        
        userProfile.addEventListener('click', (e) => {
            if (dropdown) {
                const isVisible = dropdown.classList.contains('show') || dropdown.style.display === 'block';
                if (isVisible) {
                    dropdown.classList.remove('show');
                    dropdown.style.display = 'none';
                } else {
                    dropdown.classList.add('show');
                    dropdown.style.display = 'block';
                }
                e.stopPropagation();
            }
        });

        // Hover support for desktop
        userProfile.addEventListener('mouseenter', () => {
            if (dropdown) {
                dropdown.classList.add('show');
                dropdown.style.display = 'block';
            }
        });
        
        userProfile.addEventListener('mouseleave', () => {
            if (dropdown) {
                dropdown.classList.remove('show');
                dropdown.style.display = 'none';
            }
        });
    }

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(d => {
            d.classList.remove('show');
            d.style.display = 'none';
        });
    });

    // Helper to get active user (combining Firebase user & registered voter profile)
    const getActiveUser = (firebaseUser) => {
        let localUser = null;
        try {
            const raw = localStorage.getItem('smartvote_user');
            if (raw) localUser = JSON.parse(raw);
        } catch (e) {
            console.warn("Error reading local voter session", e);
        }

        if (firebaseUser) {
            return {
                uid: firebaseUser.uid,
                displayName: (localUser && localUser.displayName) || firebaseUser.displayName || 'Voter',
                phoneNumber: (localUser && localUser.phoneNumber) || firebaseUser.phoneNumber || '',
                email: firebaseUser.email || (localUser && localUser.email) || '',
                voterId: (localUser && localUser.voterId) || 'VTR' + firebaseUser.uid.slice(0, 6).toUpperCase(),
                state: (localUser && localUser.state) || 'All India',
                progress: (localUser && localUser.progress) || { quizScore: 0, completedModules: [] },
                createdAt: (localUser && localUser.createdAt) || new Date().toISOString()
            };
        }

        return localUser;
    };

    const handleUserChange = (user) => {
        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'flex';
                userNameDisplay.textContent = user.displayName || user.phoneNumber || 'Voter';
            }

            window.dispatchEvent(new CustomEvent('authReady', { detail: user }));
            document.body.classList.add('auth-ready');
        } else {
            // User is logged out
            if (loginBtn) loginBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';

            window.dispatchEvent(new CustomEvent('authReady', { detail: null }));
            
            // Redirect if on protected dashboard page
            if (enforceAuthGating(user)) {
                document.body.classList.add('auth-ready');
            }
        }
    };

    // Logout Logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                if (confirm("Are you sure you want to sign out?")) {
                    localStorage.removeItem('smartvote_user');
                    try {
                        await signOut(auth);
                    } catch (_) {}
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Logout Error:", error);
                alert("Failed to logout: " + error.message);
            }
        });
    }

    // Check immediate local session on page load
    const initialLocalUser = getActiveUser(null);
    if (initialLocalUser) {
        handleUserChange(initialLocalUser);
    }

    // Auth State Observer
    try {
        onAuthStateChanged(auth, (firebaseUser) => {
            const activeUser = getActiveUser(firebaseUser);
            handleUserChange(activeUser);
        });
    } catch (e) {
        console.warn("onAuthStateChanged observer warning:", e);
    }
});
