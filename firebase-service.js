import { auth, db } from './firebase-config.js';
import { 
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─── Default Data Sets (Guaranteed Fallbacks) ───────────────────────────────
export const DEFAULT_MODULES = [
    {
        id: "how-elections-work",
        title: "How Elections Work",
        description: "Understand the foundational process of Indian democracy, from notification to results.",
        image: "assets/module-elections.png",
        steps: [
            { text: "Elections in India are conducted by the Election Commission of India (ECI), an autonomous constitutional authority.", image: "assets/module-elections.png" },
            { text: "The process begins with the President or Governor issuing a notification for the elections.", image: "assets/hero.png" },
            { text: "Candidates file nominations and the ECI scrutinizes them to ensure eligibility.", image: "assets/module-elections.png" },
            { text: "Campaigning occurs for a specified period, ending 48 hours before the conclusion of the poll.", image: "assets/hero.png" }
        ]
    },
    {
        id: "how-to-vote",
        title: "How to Vote",
        description: "A step-by-step guide on what to do when you arrive at the polling station.",
        image: "assets/module-vote.png",
        steps: [
            { text: "Check your name in the voter list online or at the polling station.", image: "assets/module-vote.png" },
            { text: "Identity verification is done by the first polling officer using your Voter ID or other approved IDs.", image: "assets/module-vote.png" },
            { text: "The second polling officer marks your finger with indelible ink and takes your signature.", image: "assets/module-vote.png" },
            { text: "Proceed to the voting compartment and press the button next to your candidate on the EVM.", image: "assets/module-vote.png" }
        ]
    },
    {
        id: "what-is-evm-&-vvpat",
        title: "What is EVM & VVPAT",
        description: "Learn about the technology behind Electronic Voting Machines and VVPAT verification.",
        image: "assets/hero.png",
        steps: [
            { text: "Electronic Voting Machines (EVMs) consist of two units: the Control Unit and the Balloting Unit.", image: "assets/hero.png" },
            { text: "VVPAT (Voter Verifiable Paper Audit Trail) allows voters to verify that their vote was cast correctly via a paper slip.", image: "assets/hero.png" },
            { text: "EVMs are stand-alone machines, not connected to any network, making them tamper-proof.", image: "assets/hero.png" }
        ]
    },
    {
        id: "fake-news-&-media",
        title: "Fake News & Media",
        description: "Identify misinformation and understand the Model Code of Conduct for media.",
        image: "assets/fake-news.png",
        steps: [
            { text: "Misinformation can spread rapidly during elections. Always verify news from official sources like the ECI website.", image: "assets/fake-news.png" },
            { text: "The Model Code of Conduct (MCC) sets guidelines for political parties and candidates during the election period.", image: "assets/fake-news.png" },
            { text: "Social media platforms have a 'Voluntary Code of Ethics' to prevent misuse of their platforms during elections.", image: "assets/fake-news.png" }
        ]
    }
];

export const DEFAULT_QUESTIONS = [
    {
        question: "What is the minimum age to vote in Indian elections?",
        options: ["16 years", "18 years", "21 years", "25 years"],
        correctIndex: 1
    },
    {
        question: "What does EVM stand for?",
        options: ["Electoral Voting Machine", "Electronic Voting Machine", "Election Validation Method", "Electronic Voter Matrix"],
        correctIndex: 1
    },
    {
        question: "Which button on the EVM indicates 'None of the Above'?",
        options: ["NOTA", "VVPAT", "REJECT", "CANCEL"],
        correctIndex: 0
    },
    {
        question: "Who is responsible for conducting free and fair elections in India?",
        options: ["The Supreme Court", "The Parliament", "Election Commission of India", "The President"],
        correctIndex: 2
    },
    {
        question: "What is a VVPAT?",
        options: ["A voter ID card", "A paper slip verifying your vote", "A type of EVM", "An election official"],
        correctIndex: 1
    }
];

// ─── Local Account Store Helpers ────────────────────────────────────────────
function getRegisteredUsers() {
    try {
        const raw = localStorage.getItem('smartvote_registered_users');
        return raw ? JSON.parse(raw) : [];
    } catch (_) {
        return [];
    }
}

function saveRegisteredUser(user) {
    try {
        const list = getRegisteredUsers();
        const existingIdx = list.findIndex(u => u.uid === user.uid || (u.phoneNumber && u.phoneNumber === user.phoneNumber) || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase()));
        if (existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], ...user };
        } else {
            list.push(user);
        }
        localStorage.setItem('smartvote_registered_users', JSON.stringify(list));
    } catch (e) {
        console.warn("Could not persist to smartvote_registered_users", e);
    }
}

function setActiveUser(user) {
    try {
        localStorage.setItem('smartvote_user', JSON.stringify(user));
        // Also dispatch custom event for immediate UI response
        window.dispatchEvent(new CustomEvent('authReady', { detail: user }));
    } catch (e) {
        console.warn("Could not set active smartvote_user", e);
    }
}

// ─── Voter Account Registration ─────────────────────────────────────────────
/**
 * Registers a new voter account.
 * Supports Name, Mobile, Email, Voter ID (EPIC), State, and Password.
 * @param {Object} data - Registration fields
 * @returns {Promise<Object>} - The created voter object
 */
export async function registerVoterAccount({ name, phone, email, voterId, state, password }) {
    if (!name || name.trim().length < 2) {
        throw new Error("Please enter your full name (at least 2 characters).");
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit mobile number.");
    }
    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }

    const formattedPhone = `+91${cleanPhone}`;
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Check if account already exists in local registry
    const registered = getRegisteredUsers();
    const exists = registered.find(u => u.phoneNumber === formattedPhone || (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail));
    if (exists) {
        throw new Error("An account with this mobile number or email already exists. Please sign in.");
    }

    // Auto-generate official-style EPIC Voter ID if not provided
    const epic = (voterId && voterId.trim()) 
        ? voterId.trim().toUpperCase() 
        : ('VTR' + Math.floor(1000000 + Math.random() * 9000000));

    const uid = 'voter_' + cleanPhone + '_' + Date.now().toString(36);
    const user = {
        uid,
        displayName: name.trim(),
        phoneNumber: formattedPhone,
        email: cleanEmail,
        voterId: epic,
        state: state && state.trim() ? state.trim() : 'All India',
        password, // stored locally for authentication
        createdAt: new Date().toISOString(),
        progress: {
            quizScore: 0,
            completedModules: []
        }
    };

    // Save to local registry and activate session
    saveRegisteredUser(user);
    setActiveUser(user);

    // Attempt Firebase Auth creation in background (if email is present)
    if (cleanEmail) {
        try {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch (fbAuthErr) {
            console.warn("Firebase Auth registration skipped/unavailable:", fbAuthErr.message);
        }
    }

    // Attempt Firestore persistence in background
    try {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, {
            displayName: user.displayName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            voterId: user.voterId,
            state: user.state,
            createdAt: user.createdAt,
            progress: user.progress
        });
    } catch (fsErr) {
        console.warn("Firestore sync skipped (offline or billing disabled):", fsErr.message);
    }

    return user;
}

// ─── Voter Account Sign In ──────────────────────────────────────────────────
/**
 * Signs in an existing voter with phone/email and password.
 * @param {string} identifier - Mobile number or Email
 * @param {string} password - Account password
 * @returns {Promise<Object>} - Authenticated user object
 */
export async function loginVoterAccount(identifier, password) {
    if (!identifier || !identifier.trim()) {
        throw new Error("Please enter your mobile number or email.");
    }
    if (!password) {
        throw new Error("Please enter your password.");
    }

    const raw = identifier.trim();
    const cleanPhone = raw.replace(/\D/g, '');
    const isPhone = cleanPhone.length === 10;
    const formattedPhone = isPhone ? `+91${cleanPhone}` : '';
    const cleanEmail = raw.toLowerCase();

    // Check local registry first
    const registered = getRegisteredUsers();
    let found = registered.find(u => {
        if (isPhone && u.phoneNumber === formattedPhone) return true;
        if (u.email && u.email.toLowerCase() === cleanEmail) return true;
        return false;
    });

    if (found) {
        if (found.password && found.password !== password) {
            throw new Error("Incorrect password. Please try again.");
        }
        setActiveUser(found);
        return found;
    }

    // Attempt Firebase Auth if it's an email
    if (cleanEmail.includes('@')) {
        try {
            const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const fbUser = res.user;
            const user = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || 'Voter',
                email: fbUser.email || cleanEmail,
                phoneNumber: fbUser.phoneNumber || '',
                createdAt: new Date().toISOString(),
                progress: { quizScore: 0, completedModules: [] }
            };
            saveRegisteredUser(user);
            setActiveUser(user);
            return user;
        } catch (fbErr) {
            console.warn("Firebase Auth sign in error:", fbErr.message);
        }
    }

    // If account not found in local registry, provide clear helpful message
    throw new Error("No account found with these credentials. Please check your details or register a new account.");
}

// ─── Google Sign-In ─────────────────────────────────────────────────────────
/**
 * Signs in user using Google Authentication popup with graceful fallback.
 * @returns {Promise<Object>} - The signed-in user object.
 */
export async function loginWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        const user = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Voter',
            email: fbUser.email || '',
            phoneNumber: fbUser.phoneNumber || '',
            photoURL: fbUser.photoURL || '',
            createdAt: new Date().toISOString(),
            progress: {
                quizScore: 0,
                completedModules: []
            }
        };

        // Persist locally
        saveRegisteredUser(user);
        setActiveUser(user);

        // Background sync to Firestore
        try {
            const userDocRef = doc(db, "users", fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                await setDoc(userDocRef, user);
            }
        } catch (err) {
            console.warn("Firestore sync skipped:", err.message);
        }

        return user;
    } catch (error) {
        console.error("Firebase Service: loginWithGoogle Error", error);
        throw error;
    }
}

// ─── Direct Mobile Number Quick Sign-In (Mock/Zero SMS) ─────────────────────
/**
 * Logs in voter with a verified mobile session without SMS billing.
 * @param {string} phoneNumber - The phone number (+91XXXXXXXXXX or 10 digits).
 * @returns {Promise<Object>} - The user object.
 */
export async function mockLoginUser(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanNumber.startsWith('91') && cleanNumber.length === 12 
        ? `+${cleanNumber}` 
        : `+91${cleanNumber.slice(-10)}`;

    // Check if registered user already exists
    const registered = getRegisteredUsers();
    let user = registered.find(u => u.phoneNumber === formattedPhone);

    if (!user) {
        const uid = 'voter_' + cleanNumber.slice(-10);
        user = {
            uid,
            phoneNumber: formattedPhone,
            displayName: 'Voter ' + cleanNumber.slice(-4),
            voterId: 'VTR' + cleanNumber.slice(-6),
            state: 'All India',
            createdAt: new Date().toISOString(),
            progress: {
                quizScore: 0,
                completedModules: []
            }
        };
        saveRegisteredUser(user);
    }

    setActiveUser(user);

    // Sync to Firestore if available
    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, user, { merge: true });
    } catch (err) {
        console.warn("Firestore sync skipped:", err.message);
    }

    return user;
}

// ─── Fetch Educational Modules ──────────────────────────────────────────────
/**
 * Fetches all educational modules.
 * Guaranteed to return full modules even when Firestore billing is disabled or offline.
 * @returns {Promise<Array>} - Array of module data.
 */
export async function fetchModules() {
    try {
        const querySnapshot = await getDocs(collection(db, "modules"));
        if (!querySnapshot.empty) {
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
    } catch (error) {
        console.warn("Firestore modules query unavailable, using high-fidelity built-in modules:", error.message);
    }

    return [...DEFAULT_MODULES];
}

// ─── Save Quiz Score ────────────────────────────────────────────────────────
/**
 * Saves a quiz score for the current user.
 * Guarantees local persistence and syncs to Firestore when available.
 * @param {string} userId - The user's UID.
 * @param {number} score - The raw score.
 * @param {number} total - Total questions.
 */
export async function saveQuizScore(userId, score, total) {
    const percentage = Math.round((score / total) * 100);
    const dateStr = new Date().toISOString();

    // 1. Save to local storage
    try {
        const key = 'smartvote_progress_' + userId;
        const local = JSON.parse(localStorage.getItem(key) || '{}');
        if (!local.quizScore || percentage > local.quizScore) {
            local.quizScore = percentage;
            local.lastQuizDate = dateStr;
            localStorage.setItem(key, JSON.stringify(local));
        }

        // Also update active session if matched
        const activeRaw = localStorage.getItem('smartvote_user');
        if (activeRaw) {
            const active = JSON.parse(activeRaw);
            if (active.uid === userId) {
                active.progress = active.progress || {};
                active.progress.quizScore = Math.max(active.progress.quizScore || 0, percentage);
                active.progress.lastQuizDate = dateStr;
                localStorage.setItem('smartvote_user', JSON.stringify(active));
            }
        }
    } catch (e) {
        console.warn("Local storage saveQuizScore error:", e);
    }

    // 2. Background Firestore sync
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentBest = userDoc.data().progress?.quizScore || 0;
            if (percentage > currentBest) {
                await updateDoc(userRef, {
                    "progress.quizScore": percentage,
                    "progress.lastQuizDate": dateStr
                });
            }
        } else {
            await setDoc(userRef, {
                progress: {
                    quizScore: percentage,
                    lastQuizDate: dateStr
                }
            }, { merge: true });
        }
    } catch (error) {
        console.warn("Firestore saveQuizScore sync skipped:", error.message);
    }

    return percentage;
}

// ─── Save Module Progress ───────────────────────────────────────────────────
/**
 * Saves or updates module progress for a user.
 * @param {string} userId - The user's UID.
 * @param {Object} progress - The progress object (moduleId: value).
 */
export async function saveModuleProgress(userId, progress) {
    try {
        const key = 'smartvote_progress_' + userId;
        const local = JSON.parse(localStorage.getItem(key) || '{}');
        local.completedModules = progress;
        localStorage.setItem(key, JSON.stringify(local));

        const activeRaw = localStorage.getItem('smartvote_user');
        if (activeRaw) {
            const active = JSON.parse(activeRaw);
            if (active.uid === userId) {
                active.progress = active.progress || {};
                active.progress.completedModules = progress;
                localStorage.setItem('smartvote_user', JSON.stringify(active));
            }
        }
    } catch (e) {
        console.warn("Local storage saveModuleProgress error:", e);
    }

    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { progress: { completedModules: progress } }, { merge: true });
    } catch (error) {
        console.warn("Firestore saveModuleProgress sync skipped:", error.message);
    }
}

// ─── Fetch Quiz Questions ───────────────────────────────────────────────────
/**
 * Fetches all quiz questions from Firestore or returns default question bank.
 * @returns {Promise<Array>} - Array of question objects.
 */
export async function fetchQuizQuestions() {
    try {
        const querySnapshot = await getDocs(collection(db, "quiz_questions"));
        if (!querySnapshot.empty) {
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
    } catch (error) {
        console.warn("Firestore questions unavailable, using default question bank:", error.message);
    }

    return [...DEFAULT_QUESTIONS];
}

// ─── Fetch User Data ────────────────────────────────────────────────────────
/**
 * Fetches a user document from Firestore or local storage.
 * @param {string} userId - The user's UID.
 * @returns {Promise<Object|null>} - The user data object.
 */
export async function fetchUserData(userId) {
    // 1. Try Firestore
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        }
    } catch (error) {
        console.warn("Firestore fetchUserData error:", error.message);
    }

    // 2. Try Local Storage
    try {
        const activeRaw = localStorage.getItem('smartvote_user');
        if (activeRaw) {
            const active = JSON.parse(activeRaw);
            if (active.uid === userId) {
                const key = 'smartvote_progress_' + userId;
                const localProg = JSON.parse(localStorage.getItem(key) || '{}');
                return {
                    ...active,
                    progress: {
                        quizScore: localProg.quizScore || active.progress?.quizScore || 0,
                        lastQuizDate: localProg.lastQuizDate || active.progress?.lastQuizDate || null,
                        completedModules: localProg.completedModules || active.progress?.completedModules || {}
                    }
                };
            }
        }

        const registered = getRegisteredUsers();
        const found = registered.find(u => u.uid === userId);
        if (found) {
            return found;
        }
    } catch (_) {}

    return null;
}

// ─── Seeding Utilities (Backward Compatible) ────────────────────────────────
export async function seedCollectionIfEmpty(collectionName, dataArray, idField = null) {
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        if (snapshot.empty) {
            for (const item of dataArray) {
                if (idField && item[idField]) {
                    const docId = item[idField].toLowerCase().replace(/ /g, '-');
                    await setDoc(doc(db, collectionName, docId), item);
                } else {
                    const { addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await addDoc(colRef, item);
                }
            }
            return true;
        }
        return false;
    } catch (error) {
        console.warn(`seedCollectionIfEmpty (${collectionName}) skipped:`, error.message);
        return false;
    }
}

export async function seedModule(moduleId, moduleData) {
    try {
        await setDoc(doc(db, "modules", moduleId), moduleData);
    } catch (error) {
        console.warn("seedModule skipped:", error.message);
    }
}
