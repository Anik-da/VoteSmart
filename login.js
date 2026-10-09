import { 
    loginWithGoogle, 
    mockLoginUser, 
    registerVoterAccount, 
    loginVoterAccount 
} from './firebase-service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabSignin = document.getElementById('tab-btn-signin');
    const tabRegister = document.getElementById('tab-btn-register');
    const signinSection = document.getElementById('signin-section');
    const registerSection = document.getElementById('register-section');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const feedbackMsg = document.getElementById('feedback-msg');

    // Sign In Elements
    const signinForm = document.getElementById('signin-form');
    const signinIdentifier = document.getElementById('signin-identifier');
    const signinPassword = document.getElementById('signin-password');
    const signinSubmitBtn = document.getElementById('signin-submit-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Quick Mobile Elements
    const quickMobileBtn = document.getElementById('quick-mobile-btn');
    const quickMobileBox = document.getElementById('quick-mobile-box');
    const quickPhoneInput = document.getElementById('quick-phone-input');
    const quickPhoneSubmit = document.getElementById('quick-phone-submit');

    // Register Elements
    const registerForm = document.getElementById('register-form');
    const regName = document.getElementById('reg-name');
    const regPhone = document.getElementById('reg-phone');
    const regEmail = document.getElementById('reg-email');
    const regVoterId = document.getElementById('reg-voter-id');
    const regState = document.getElementById('reg-state');
    const regPassword = document.getElementById('reg-password');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const googleRegisterBtn = document.getElementById('google-register-btn');

    // Active Session Banner
    const activeSessionBanner = document.getElementById('active-session-banner');
    const currentUserName = document.getElementById('current-user-name');
    const sessionLogoutBtn = document.getElementById('session-logout-btn');

    // Helper: Show Feedback
    function showFeedback(text, type = 'error') {
        if (!feedbackMsg) return;
        feedbackMsg.textContent = text;
        feedbackMsg.style.color = type === 'error' ? '#ef4444' : '#10b981';
        feedbackMsg.style.fontWeight = '600';
    }

    function clearFeedback() {
        if (!feedbackMsg) return;
        feedbackMsg.textContent = '';
    }

    // Check Active Session
    try {
        const rawUser = localStorage.getItem('smartvote_user');
        if (rawUser) {
            const user = JSON.parse(rawUser);
            if (activeSessionBanner && currentUserName) {
                currentUserName.textContent = user.displayName || user.phoneNumber || 'Voter';
                activeSessionBanner.style.display = 'block';
            }
        }
    } catch (_) {}

    if (sessionLogoutBtn) {
        sessionLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('smartvote_user');
            if (activeSessionBanner) activeSessionBanner.style.display = 'none';
            showFeedback("Signed out successfully. You can now log in or register a new account.", "success");
            setTimeout(clearFeedback, 3500);
        });
    }

    // Tab Switching
    function switchToSignin() {
        clearFeedback();
        tabSignin.classList.add('active');
        tabRegister.classList.remove('active');
        signinSection.classList.add('active');
        registerSection.classList.remove('active');
        authTitle.textContent = "Welcome Back";
        authSubtitle.textContent = "Sign in to access your voter profile & dashboard.";
    }

    function switchToRegister() {
        clearFeedback();
        tabRegister.classList.add('active');
        tabSignin.classList.remove('active');
        registerSection.classList.add('active');
        signinSection.classList.remove('active');
        authTitle.textContent = "Register New Account";
        authSubtitle.textContent = "Create your voter profile to start learning and test your voting readiness.";
    }

    if (tabSignin) tabSignin.addEventListener('click', switchToSignin);
    if (tabRegister) tabRegister.addEventListener('click', switchToRegister);

    // Quick Mobile Box Toggle
    if (quickMobileBtn && quickMobileBox) {
        quickMobileBtn.addEventListener('click', () => {
            const isVisible = quickMobileBox.style.display === 'block';
            quickMobileBox.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && quickPhoneInput) quickPhoneInput.focus();
        });
    }

    // ─── Sign In Submission ─────────────────────────────────────────────────
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFeedback();

            const identifier = signinIdentifier.value.trim();
            const password = signinPassword.value;

            if (!identifier) {
                showFeedback("Please enter your mobile number or email.");
                signinIdentifier.focus();
                return;
            }
            if (!password) {
                showFeedback("Please enter your password.");
                signinPassword.focus();
                return;
            }

            signinSubmitBtn.disabled = true;
            signinSubmitBtn.textContent = "Signing In...";

            try {
                const user = await loginVoterAccount(identifier, password);
                showFeedback(`Welcome back, ${user.displayName}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 700);
            } catch (err) {
                console.error("Sign-in error:", err);
                showFeedback(err.message || "Failed to sign in. Please verify your credentials.");
                signinSubmitBtn.disabled = false;
                signinSubmitBtn.textContent = "Sign In to Voter Profile";
            }
        });
    }

    // Quick Mobile Access Submit
    if (quickPhoneSubmit) {
        quickPhoneSubmit.addEventListener('click', async () => {
            clearFeedback();
            const num = (quickPhoneInput.value || '').trim().replace(/\D/g, '');
            if (num.length !== 10) {
                showFeedback("Please enter a valid 10-digit mobile number.");
                return;
            }

            quickPhoneSubmit.disabled = true;
            quickPhoneSubmit.textContent = "Authenticating...";

            try {
                const user = await mockLoginUser(num);
                showFeedback(`Welcome, ${user.displayName}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 700);
            } catch (err) {
                console.error("Quick login error:", err);
                showFeedback("Authentication failed. Please try again.");
                quickPhoneSubmit.disabled = false;
                quickPhoneSubmit.textContent = "Enter as Verified Voter";
            }
        });
    }

    // ─── Registration Submission ────────────────────────────────────────────
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFeedback();

            const name = regName.value.trim();
            const phone = regPhone.value.trim();
            const email = regEmail.value.trim();
            const voterId = regVoterId.value.trim();
            const state = regState.value;
            const password = regPassword.value;

            if (!name || name.length < 2) {
                showFeedback("Please enter your full name.");
                regName.focus();
                return;
            }

            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
                showFeedback("Please enter a valid 10-digit mobile number.");
                regPhone.focus();
                return;
            }

            if (!password || password.length < 6) {
                showFeedback("Password must be at least 6 characters long.");
                regPassword.focus();
                return;
            }

            registerSubmitBtn.disabled = true;
            registerSubmitBtn.textContent = "Creating Account...";

            try {
                const user = await registerVoterAccount({
                    name,
                    phone: cleanPhone,
                    email,
                    voterId,
                    state,
                    password
                });

                showFeedback(`Account created successfully! Welcome, ${user.displayName}! Redirecting to your dashboard...`, 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 900);
            } catch (err) {
                console.error("Registration error:", err);
                showFeedback(err.message || "Failed to create account. Please try again.");
                registerSubmitBtn.disabled = false;
                registerSubmitBtn.textContent = "✅ Create Voter Account";
            }
        });
    }

    // ─── Google Sign-In Handler ─────────────────────────────────────────────
    const handleGoogleAuth = async (btn) => {
        clearFeedback();
        const origText = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = "Connecting with Google...";

        try {
            const user = await loginWithGoogle();
            showFeedback(`Signed in with Google as ${user.displayName}! Redirecting...`, 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } catch (error) {
            console.error("Google Auth Error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                showFeedback("Google Sign-In failed: " + (error.message || error.code));
            }
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    };

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleGoogleAuth(googleLoginBtn));
    }
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', () => handleGoogleAuth(googleRegisterBtn));
    }
});
