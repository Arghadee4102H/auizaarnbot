// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- TELEGRAM & FIREBASE INITIALIZATION ---
    const tg = window.Telegram.WebApp;
    tg.expand(); // Expand the web app to full screen

    // !!! IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE !!!
    const firebaseConfig = {
        apiKey: "AIzaSyBInsXIdEW-SMdV3P4VftpCOu2z6_3xuFc",
        authDomain: "auiz-aarn-bot.firebaseapp.com",
        databaseURL: "https://auiz-aarn-bot-default-rtdb.firebaseio.com",
        projectId: "auiz-aarn-bot",
        storageBucket: "auiz-aarn-bot.firebasestorage.app",
        messagingSenderId: "504155433111",
        appId: "1:504155433111:web:50f7c5e0d65d318a47e1d2"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // --- GLOBAL STATE & CONSTANTS ---
    let currentUser = null;
    let currentQuestion = null;
    let quizTimer = null;
    const QUIZ_TIME_LIMIT = 10; // 10 seconds
    const BOT_USERNAME = "AuizAarnBot"; // Your bot's username
    const WEBAPP_URL = `http://t.me/${BOT_USERNAME}/aarn`;
    
    // --- DOM ELEMENT REFERENCES ---
    const loader = document.getElementById('loader-overlay');
    const appContainer = document.getElementById('app-container');
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const mainContent = document.getElementById('main-content');
    
    // Profile
    const profileUsername = document.getElementById('profile-username');
    const profileUserid = document.getElementById('profile-userid');
    const profilePoints = document.getElementById('profile-points');
    const profileEnergy = document.getElementById('profile-energy');
    const profileQuizLimit = document.getElementById('profile-quiz-limit');
    const profileReferrals = document.getElementById('profile-referrals');
    const profileReferralCode = document.getElementById('profile-referral-code');

    // Quiz
    const quizHome = document.getElementById('quiz-home');
    const quizGame = document.getElementById('quiz-game');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const timerBar = document.getElementById('timer-bar');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackText = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    // Premium
    const joinChannelBtn = document.getElementById('join-channel-btn');
    const watchAdQuizBtn = document.getElementById('watch-ad-quiz-btn');
    const watchAdEnergyBtn = document.getElementById('watch-ad-energy-btn');
    const starsButtons = document.querySelectorAll('.stars-btn');

    // Referral
    const referralLinkInput = document.getElementById('referral-link-input');
    const copyReferralBtn = document.getElementById('copy-referral-btn');
    const shareReferralBtn = document.getElementById('share-referral-btn');
    const submitReferralInput = document.getElementById('submit-referral-input');
    const submitReferralBtn = document.getElementById('submit-referral-btn');
    
    // History
    const historyToggleBtns = document.querySelectorAll('.history-toggle .toggle-btn');
    const pointsHistoryContainer = document.getElementById('points-history-container');
    const withdrawalHistoryContainer = document.getElementById('withdrawal-history-container');
    
    // Withdraw
    const withdrawOptions = document.querySelector('.withdraw-options');
    const withdrawFormContainer = document.getElementById('withdraw-form-container');
    const withdrawAmountText = document.getElementById('withdraw-amount-text');
    const withdrawForm = document.getElementById('withdraw-form');
    const paymentAddressInput = document.getElementById('payment-address');
    const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
    
    // Modal
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- USER AUTHENTICATION & DATA HANDLING ---
    function initializeUser() {
        const user = tg.initDataUnsafe.user;
        if (!user || !user.id) {
            showModal("Authentication Error", "Could not verify your Telegram account. Please try again through the bot.");
            return;
        }

        const userId = user.id.toString();
        const username = user.username || `user${user.id}`;
        const userRef = db.ref('users/' + userId);

        userRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                currentUser = snapshot.val();
                handleDailyReset(); // Check for daily reset before updating UI
            } else {
                const referralCode = `A${username.replace(/[^a-zA-Z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;
                const newUser = {
                    id: userId,
                    username: username,
                    points: 0,
                    energy: 5,
                    quizLimit: 15,
                    totalReferrals: 0,
                    referralCode: referralCode,
                    referredBy: null,
                    usedReferralCode: false,
                    history: {},
                    premium: {
                        lastChannelClaim: null,
                        adQuizClaims: 0,
                        adEnergyClaims: 0,
                        lastBoostPurchase: null,
                        boostPurchasesToday: 0,
                        lastDayPurchase: null,
                        dayPurchasesToday: 0,
                        weeklyPremium: {
                            active: false,
                            expiry: null
                        }
                    },
                    lastLogin: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                    playedQuizIds: {},
                    usedFirstWithdrawal: false,
                };
                userRef.set(newUser);
                currentUser = newUser;
                handleReferralFromStartParam();
            }
            updateAllUI();
            hideLoader();
        }, (error) => {
            console.error("Firebase read failed: " + error.code);
            showModal("Database Error", "Could not connect to the database. Please check your connection and try again.");
        });
    }

    function handleReferralFromStartParam() {
        const startParam = tg.initDataUnsafe.start_param;
        if (startParam && startParam.startsWith('REF_')) {
            const referrerCode = startParam.split('_')[1];
            if (referrerCode && !currentUser.usedReferralCode && currentUser.referralCode !== referrerCode) {
                submitReferralCode(referrerCode, true);
            }
        }
    }

    function handleDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        if (currentUser.lastLogin !== today) {
            let updates = {
                lastLogin: today,
                energy: 5,
                quizLimit: 15,
                'premium/lastChannelClaim': null,
                'premium/adQuizClaims': 0,
                'premium/adEnergyClaims': 0,
                'premium/boostPurchasesToday': 0,
                'premium/dayPurchasesToday': 0,
            };

            // Check if weekly premium is active
            if (currentUser.premium?.weeklyPremium?.active) {
                if (new Date() > new Date(currentUser.premium.weeklyPremium.expiry)) {
                    updates['premium/weeklyPremium/active'] = false;
                    updates['premium/weeklyPremium/expiry'] = null;
                } else {
                    updates.quizLimit = 145 + 15; // Base + weekly
                    updates.energy = 7 + 5; // Base + weekly
                }
            }
            
            db.ref('users/' + currentUser.id).update(updates);
        }
    }
    
    // --- UI UPDATE FUNCTIONS ---
    function updateAllUI() {
        if (!currentUser) return;
        updateProfileUI();
        updateReferralUI();
        updatePremiumUI();
        updateWithdrawUI();
        updateHistoryUI();
    }
    
    function updateProfileUI() {
        profileUsername.textContent = currentUser.username;
        profileUserid.textContent = currentUser.id;
        profilePoints.textContent = currentUser.points || 0;
        profileEnergy.textContent = `${currentUser.energy || 0}/5`;
        profileQuizLimit.textContent = `${currentUser.quizLimit || 0}/15+`;
        profileReferrals.textContent = currentUser.totalReferrals || 0;
        profileReferralCode.textContent = currentUser.referralCode;
    }
    
    function updateReferralUI() {
        referralLinkInput.value = `${WEBAPP_URL}?startapp=REF_${currentUser.referralCode}`;
        if (currentUser.usedReferralCode) {
            document.getElementById('submit-referral-container').innerHTML = `<p>You've already used a referral code.</p>`;
        }
    }

    function updatePremiumUI() {
        const today = new Date().toISOString().split('T')[0];
        const premium = currentUser.premium || {};

        // Channel Task
        joinChannelBtn.disabled = premium.lastChannelClaim === today;
        joinChannelBtn.textContent = joinChannelBtn.disabled ? "Claimed Today" : "Join & Claim (+5 Points)";

        // Ad Tasks
        watchAdQuizBtn.disabled = (premium.adQuizClaims || 0) >= 3;
        watchAdQuizBtn.textContent = `Get +1 Quiz Limit (${3 - (premium.adQuizClaims || 0)}/day)`;
        
        watchAdEnergyBtn.disabled = (premium.adEnergyClaims || 0) >= 5;
        watchAdEnergyBtn.textContent = `Get +1 Energy (${5 - (premium.adEnergyClaims || 0)}/day)`;

        // Stars Tasks
        starsButtons.forEach(btn => {
            const type = btn.dataset.type;
            if (type === 'boost') {
                btn.disabled = (premium.boostPurchasesToday || 0) >= 7;
            } else if (type === 'day') {
                btn.disabled = (premium.dayPurchasesToday || 0) >= 1;
            } else if (type === 'week') {
                btn.disabled = premium.weeklyPremium?.active === true || new Date(premium.weeklyPremium?.expiry) > new Date();
            }
        });
    }

    function updateHistoryUI() {
        // Points History
        pointsHistoryContainer.innerHTML = '';
        if (currentUser.history) {
            const historyEntries = Object.values(currentUser.history).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            historyEntries.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const pointsClass = entry.points > 0 ? 'positive' : 'negative';
                const sign = entry.points > 0 ? '+' : '';
                item.innerHTML = `
                    <div class="history-item-details">
                        <span class="history-source">${entry.source}</span>
                        <span class="history-date">${new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <span class="history-points ${pointsClass}">${sign}${entry.points}</span>
                `;
                pointsHistoryContainer.appendChild(item);
            });
        } else {
             pointsHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">No points history yet.</p>';
        }

        // Withdrawal History
        withdrawalHistoryContainer.innerHTML = '';
        db.ref('withdrawals').orderByChild('userId').equalTo(currentUser.id).once('value', snapshot => {
             if (snapshot.exists()) {
                const withdrawalEntries = Object.values(snapshot.val()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                withdrawalEntries.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerHTML = `
                        <div class="history-item-details">
                            <span class="history-source">${entry.amount} Points via ${entry.method}</span>
                             <span class="history-date">${new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <span class="status status-${entry.status}">${entry.status}</span>
                    `;
                    withdrawalHistoryContainer.appendChild(item);
                });
            } else {
                withdrawalHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">No withdrawal history yet.</p>';
            }
        });
    }

    function updateWithdrawUI() {
        withdrawOptions.querySelectorAll('.withdraw-btn').forEach(btn => {
            const requiredPoints = parseInt(btn.dataset.points);
            btn.disabled = currentUser.points < requiredPoints;
            if (btn.dataset.usd === "0.10" && currentUser.usedFirstWithdrawal) {
                btn.disabled = true;
                btn.textContent = "740 P (Used)";
            }
        });
    }
    
    // --- NAVIGATION ---
    function navigateTo(targetId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.nav-btn[data-target="${targetId}"]`).classList.add('active');
        mainContent.scrollTop = 0; // Scroll to top on page change
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => navigateTo(button.dataset.target));
    });

    // --- QUIZ LOGIC ---
    startQuizBtn.addEventListener('click', () => {
        if (currentUser.quizLimit <= 0) {
            showModal("No Quizzes Left", "You've used all your quizzes for today. Get more in the Premium section or come back tomorrow!");
            return;
        }
        if (currentUser.energy <= 0) {
            showModal("Out of Energy", "You need energy to play. Get more by watching ads or come back tomorrow.");
            return;
        }
        startQuiz();
    });

    function startQuiz() {
        quizHome.classList.add('hidden');
        quizGame.classList.remove('hidden');
        loadNextQuestion();
    }
    
    function loadNextQuestion() {
        if (currentUser.quizLimit <= 0) {
            endQuiz("Quiz Limit Reached", "You've finished your quizzes for today!");
            return;
        }

        const playedIds = Object.keys(currentUser.playedQuizIds || {});
        const availableQuestions = quizQuestions.filter((q, index) => !playedIds.includes(index.toString()));
        
        if (availableQuestions.length === 0) {
            endQuiz("Congratulations!", "You have answered all available questions!");
            return;
        }

        currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        const originalIndex = quizQuestions.indexOf(currentQuestion);
        
        db.ref(`users/${currentUser.id}/playedQuizIds/${originalIndex}`).set(true); // Mark as played

        questionText.textContent = currentQuestion.question;
        optionsContainer.innerHTML = '';
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => handleAnswer(option));
            optionsContainer.appendChild(button);
        });

        startTimer();
    }

    function startTimer() {
        clearInterval(quizTimer);
        let timeLeft = QUIZ_TIME_LIMIT;
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        void timerBar.offsetWidth; // Trigger reflow
        timerBar.style.transition = `width ${QUIZ_TIME_LIMIT}s linear`;
        timerBar.style.animation = `gradient-shift ${QUIZ_TIME_LIMIT}s linear`;
        timerBar.style.width = '0%';

        quizTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(quizTimer);
                handleAnswer(null); // Timeout is a wrong answer
            }
        }, 1000);
    }
    
    function handleAnswer(selectedOption) {
        clearInterval(quizTimer);
        timerBar.style.animation = 'none';
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => btn.classList.add('disabled'));

        const isCorrect = selectedOption === currentQuestion.answer;
        let pointsEarned = 0;
        let updates = {};

        if (isCorrect) {
            pointsEarned = 5;
            feedbackTitle.textContent = "Congratulations!";
            feedbackText.textContent = `You win ${pointsEarned} points.`;
            updates.points = (currentUser.points || 0) + pointsEarned;
        } else {
            pointsEarned = 1;
            feedbackTitle.textContent = "Oops!";
            feedbackText.innerHTML = `The correct answer was <strong>${currentQuestion.answer}</strong>. Better luck next time! You win ${pointsEarned} point.`;
            updates.points = (currentUser.points || 0) + pointsEarned;
            updates.energy = Math.max(0, (currentUser.energy || 0) - 1);
        }
        
        updates.quizLimit = Math.max(0, (currentUser.quizLimit || 0) - 1);
        
        logHistory(isCorrect ? 'Quiz Win' : 'Quiz Loss', pointsEarned);
        db.ref('users/' + currentUser.id).update(updates);

        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.textContent === currentQuestion.answer) {
                btn.classList.add('correct');
            } else if (btn.textContent === selectedOption) {
                btn.classList.add('wrong');
            }
        });

        setTimeout(() => {
            quizFeedback.classList.remove('hidden');
        }, 1000);
    }

    nextQuestionBtn.addEventListener('click', () => {
        quizFeedback.classList.add('hidden');
        loadNextQuestion();
    });

    function endQuiz(title, text) {
        quizGame.classList.add('hidden');
        quizHome.classList.remove('hidden');
        showModal(title, text);
    }

    // --- PREMIUM & TASKS LOGIC ---
    joinChannelBtn.addEventListener('click', () => {
        tg.openTelegramLink('https://t.me/AGuttuGhosh');
        const today = new Date().toISOString().split('T')[0];
        logHistory('Channel Bonus', 5);
        db.ref(`users/${currentUser.id}`).update({
            'premium/lastChannelClaim': today,
            points: (currentUser.points || 0) + 5
        });
        showModal("Task Complete!", "You have earned 5 points! This task will be available again tomorrow.");
    });
    
    function watchAdForReward(type) {
        // Monetag rewarded interstitial call
        if (typeof show_9405037 === 'function') {
            show_9405037().then(() => {
                // User watched the ad, grant reward
                let updates = {};
                let message = "";
                if (type === 'quiz') {
                    const newClaims = (currentUser.premium.adQuizClaims || 0) + 1;
                    updates['premium/adQuizClaims'] = newClaims;
                    updates.quizLimit = (currentUser.quizLimit || 0) + 1;
                    logHistory('Ad Reward (Quiz)', 0);
                    message = "You've received +1 Quiz Limit for today!";
                } else if (type === 'energy') {
                    const newClaims = (currentUser.premium.adEnergyClaims || 0) + 1;
                    updates['premium/adEnergyClaims'] = newClaims;
                    updates.energy = (currentUser.energy || 0) + 1;
                    logHistory('Ad Reward (Energy)', 0);
                    message = "You've received +1 Energy!";
                }
                db.ref('users/' + currentUser.id).update(updates);
                showModal("Reward Granted!", message);
            }).catch(error => {
                console.error("Ad error:", error);
                showModal("Ad Not Available", "The ad could not be shown. Please try again later.");
            });
        } else {
             showModal("Ad SDK Error", "The ad functionality is not available right now.");
        }
    }
    
    watchAdQuizBtn.addEventListener('click', () => watchAdForReward('quiz'));
    watchAdEnergyBtn.addEventListener('click', () => watchAdForReward('energy'));

    starsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            let stars, payload, confirmationText;

            switch (type) {
                case 'boost':
                    stars = 1;
                    payload = 'boost_1';
                    confirmationText = 'Pay ★1 for +1 extra quiz today?';
                    break;
                case 'day':
                    stars = 15;
                    payload = 'day_premium_15';
                    confirmationText = 'Pay ★15 for the Day Premium (+20 quiz, +7 energy)?';
                    break;
                case 'week':
                    stars = 100;
                    payload = 'weekly_premium_100';
                    confirmationText = 'Pay ★100 for the Weekly Premium (+145 quiz/day, +7 energy/day for 7 days)?';
                    break;
                default: return;
            }

            tg.showConfirm(confirmationText, (ok) => {
                if (ok) {
                    tg.openInvoice(`test_invoice_${payload}_${Date.now()}`, (status) => {
                        if (status === 'paid') {
                             showModal("Payment Successful!", "Your premium features are being activated. The app will update shortly.");
                        } else if (status === 'failed') {
                            showModal("Payment Failed", "The transaction could not be completed. Please try again.");
                        } else { // 'cancelled' or other
                            showModal("Payment Cancelled", "The payment process was cancelled.");
                        }
                    });
                }
            });
        });
    });


    // --- REFERRAL LOGIC ---
    copyReferralBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(referralLinkInput.value).then(() => {
            showModal("Copied!", "Referral link copied to clipboard.");
        });
    });

    shareReferralBtn.addEventListener('click', () => {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLinkInput.value)}&text=${encodeURIComponent("Join Auiz Aarn Bot and earn points!")}`);
    });

    submitReferralBtn.addEventListener('click', () => {
        const code = submitReferralInput.value.trim();
        submitReferralCode(code, false);
    });

    function submitReferralCode(code, fromStartParam = false) {
        if (!code) {
            showModal("Invalid Code", "Please enter a referral code.");
            return;
        }
        if (currentUser.usedReferralCode) {
            if (!fromStartParam) showModal("Already Used", "You have already used a referral code.");
            return;
        }
        if (code === currentUser.referralCode) {
            showModal("Can't Self-Refer", "You cannot use your own referral code.");
            return;
        }

        const usersRef = db.ref('users');
        usersRef.orderByChild('referralCode').equalTo(code).once('value', (snapshot) => {
            if (snapshot.exists()) {
                const referrerId = Object.keys(snapshot.val())[0];
                const referrerData = snapshot.val()[referrerId];

                // Update current user (referee)
                db.ref(`users/${currentUser.id}`).update({
                    points: (currentUser.points || 0) + 5,
                    usedReferralCode: true,
                    referredBy: referrerId,
                });
                logHistory('Referral Bonus', 5, currentUser.id);

                // Update referrer
                db.ref(`users/${referrerId}`).update({
                    points: (referrerData.points || 0) + 10,
                    totalReferrals: (referrerData.totalReferrals || 0) + 1
                });
                logHistory(`Referred ${currentUser.username}`, 10, referrerId);

                showModal("Success!", "You've received 5 points! Your friend has received 10 points.");
                submitReferralInput.value = '';
            } else {
                showModal("Invalid Code", "The referral code you entered does not exist.");
            }
        });
    }


    // --- HISTORY TOGGLE ---
    historyToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            historyToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.history-container').forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });


    // --- WITHDRAW LOGIC ---
    withdrawOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('withdraw-btn') && !e.target.disabled) {
            const points = e.target.dataset.points;
            const usd = e.target.dataset.usd;
            withdrawAmountText.textContent = `${points} Points ($${usd})`;
            withdrawForm.dataset.points = points;
            withdrawForm.dataset.isFirst = (usd === "0.10");
            withdrawFormContainer.classList.remove('hidden');
        }
    });

    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'TON') {
                paymentAddressInput.placeholder = "Enter your TON wallet address (e.g., UQ...)";
            } else {
                paymentAddressInput.placeholder = "Enter your Binance Pay ID (e.g., 123456789)";
            }
        });
    });

    withdrawForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pointsToWithdraw = parseInt(withdrawForm.dataset.points);
        const isFirstWithdrawal = withdrawForm.dataset.isFirst === "true";
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const address = paymentAddressInput.value.trim();

        if (!address) {
            showModal("Missing Information", "Please enter your payment address or ID.");
            return;
        }

        const withdrawalId = `wd_${currentUser.id}_${Date.now()}`;
        const request = {
            id: withdrawalId,
            userId: currentUser.id,
            username: currentUser.username,
            amount: pointsToWithdraw,
            method: method,
            address: address,
            status: 'Pending',
            timestamp: new Date().toISOString()
        };
        
        // Push to global withdrawals table
        db.ref('withdrawals/' + withdrawalId).set(request);

        // Update user data
        let userUpdates = {
            points: currentUser.points - pointsToWithdraw
        };
        if (isFirstWithdrawal) {
            userUpdates.usedFirstWithdrawal = true;
        }
        db.ref('users/' + currentUser.id).update(userUpdates);
        logHistory(`Withdrawal Request`, -pointsToWithdraw);

        showModal("Request Submitted", `Your withdrawal request for ${pointsToWithdraw} points has been submitted and is now pending review.`);
        withdrawFormContainer.classList.add('hidden');
        withdrawForm.reset();
    });

    // --- UTILITY FUNCTIONS ---
    function hideLoader() {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.classList.add('hidden');
            appContainer.classList.remove('hidden');
        }, 500);
    }

    function showModal(title, text) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modal.classList.remove('hidden');
    }

    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
    
    function logHistory(source, points, targetUserId = null) {
        const userId = targetUserId || currentUser.id;
        const historyRef = db.ref(`users/${userId}/history`).push();
        historyRef.set({
            source: source,
            points: points,
            timestamp: new Date().toISOString()
        });
    }

    // --- START THE APP ---
    initializeUser();
});
