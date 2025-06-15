// script.js (UPDATED)

document.addEventListener('DOMContentLoaded', () => {
    // --- TELEGRAM & FIREBASE INITIALIZATION ---
    try {
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.ready();

        // !!! IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE !!!
        // Make sure this is 100% correct. Double-check it.
        const firebaseConfig = {
            apiKey: "AIzaSyBInsXIdEW-SMdV3P4VftpCOu2z6_3xuFc",
            authDomain: "auiz-aarn-bot.firebaseapp.com",
            databaseURL: "https://auiz-aarn-bot-default-rtdb.firebaseio.com",
            projectId: "auiz-aarn-bot",
            storageBucket: "auiz-aarn-bot.firebasestorage.app",
            messagingSenderId: "504155433111",
            appId: "1:504155433111:web:50f7c5e0d65d318a47e1d2"
        };

        if (firebaseConfig.apiKey === "AIzaSyBInsXIdEW-SMdV3P4VftpCOu2z6_3xuFc") {
             showModal("Configuration Error", "Firebase is not configured. Please paste your firebaseConfig into script.js.");
             return;
        }

        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        // --- GLOBAL STATE & CONSTANTS ---
        let currentUser = null;
        let currentQuestion = null;
        let quizTimer = null;
        const QUIZ_TIME_LIMIT = 10;
        const BOT_USERNAME = "AuizAarnBot"; 
        const WEBAPP_URL = `http://t.me/${BOT_USERNAME}/aarn`;
        
        // --- DOM ELEMENT REFERENCES (Keep all these as they are) ---
        const loader = document.getElementById('loader-overlay');
        const appContainer = document.getElementById('app-container');
        const pages = document.querySelectorAll('.page');
        const navButtons = document.querySelectorAll('.nav-btn');
        const mainContent = document.getElementById('main-content');
        
        const profileUsername = document.getElementById('profile-username');
        const profileUserid = document.getElementById('profile-userid');
        const profilePoints = document.getElementById('profile-points');
        const profileEnergy = document.getElementById('profile-energy');
        const profileQuizLimit = document.getElementById('profile-quiz-limit');
        const profileReferrals = document.getElementById('profile-referrals');
        const profileReferralCode = document.getElementById('profile-referral-code');

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

        const joinChannelBtn = document.getElementById('join-channel-btn');
        const watchAdQuizBtn = document.getElementById('watch-ad-quiz-btn');
        const watchAdEnergyBtn = document.getElementById('watch-ad-energy-btn');
        const starsButtons = document.querySelectorAll('.stars-btn');

        const referralLinkInput = document.getElementById('referral-link-input');
        const copyReferralBtn = document.getElementById('copy-referral-btn');
        const shareReferralBtn = document.getElementById('share-referral-btn');
        const submitReferralInput = document.getElementById('submit-referral-input');
        const submitReferralBtn = document.getElementById('submit-referral-btn');
        
        const historyToggleBtns = document.querySelectorAll('.history-toggle .toggle-btn');
        const pointsHistoryContainer = document.getElementById('points-history-container');
        const withdrawalHistoryContainer = document.getElementById('withdrawal-history-container');
        
        const withdrawOptions = document.querySelector('.withdraw-options');
        const withdrawFormContainer = document.getElementById('withdraw-form-container');
        const withdrawAmountText = document.getElementById('withdraw-amount-text');
        const withdrawForm = document.getElementById('withdraw-form');
        const paymentAddressInput = document.getElementById('payment-address');
        const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
        
        const modal = document.getElementById('custom-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');
        const modalCloseBtn = document.getElementById('modal-close-btn');

        // --- USER AUTHENTICATION & DATA HANDLING ---
        function initializeUser() {
            if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
                showModal("Authentication Error", "Could not verify your Telegram account. Please launch the app from the bot's menu button.");
                return;
            }

            const user = tg.initDataUnsafe.user;
            const userId = user.id.toString();
            const username = user.username || `user${user.id}`;
            const userRef = db.ref('users/' + userId);

            userRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    currentUser = snapshot.val();
                    handleDailyReset();
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
                            boostPurchasesToday: 0,
                            dayPurchasesToday: 0,
                            weeklyPremium: { active: false, expiry: null }
                        },
                        lastLogin: new Date().toISOString().split('T')[0],
                        playedQuizIds: {},
                        usedFirstWithdrawal: false,
                    };
                    userRef.set(newUser).then(() => {
                        currentUser = newUser;
                        handleReferralFromStartParam();
                        updateAllUI();
                        hideLoader();
                    });
                }
            }, (error) => {
                console.error("Firebase read failed: ", error);
                showModal("Database Error", "Could not connect to the database. Please check your internet connection and the Firebase configuration. Error: " + error.message);
            });
        }
        
        function hideLoader() {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
                appContainer.classList.remove('hidden');
            }, 500);
        }

        // --- All other functions (handleDailyReset, updateAllUI, etc.) ---
        // The rest of the script.js file is the same as the one I provided before.
        // It's long, so I will attach the full logic here.
        // Please copy from this point to the end.
        
        function handleDailyReset() {
            const today = new Date().toISOString().split('T')[0];
            if (!currentUser.lastLogin || currentUser.lastLogin !== today) {
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
                
                let weeklyPremium = currentUser.premium?.weeklyPremium;
                if (weeklyPremium?.active) {
                    if (new Date() > new Date(weeklyPremium.expiry)) {
                        updates['premium/weeklyPremium/active'] = false;
                        updates['premium/weeklyPremium/expiry'] = null;
                    } else {
                        updates.quizLimit = 145 + 15;
                        updates.energy = 7 + 5;
                    }
                }
                
                db.ref('users/' + currentUser.id).update(updates).then(() => {
                     // After daily reset is confirmed, update UI
                    db.ref('users/' + currentUser.id).once('value', (snapshot) => {
                        currentUser = snapshot.val();
                        updateAllUI();
                        hideLoader();
                    });
                });
            } else {
                // If it's the same day, just update and show
                updateAllUI();
                hideLoader();
            }
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
            profileEnergy.textContent = `${currentUser.energy || 0}/5+`;
            profileQuizLimit.textContent = `${currentUser.quizLimit || 0}/15+`;
            profileReferrals.textContent = currentUser.totalReferrals || 0;
            profileReferralCode.textContent = currentUser.referralCode;
        }
        
        function updateReferralUI() {
            referralLinkInput.value = `https://t.me/${BOT_USERNAME}?start=REF_${currentUser.referralCode}`;
            if (currentUser.usedReferralCode) {
                document.getElementById('submit-referral-container').innerHTML = `<p style="text-align:center; color: var(--text-gray);">You've already used a referral code.</p>`;
            }
        }

        function updatePremiumUI() {
            const today = new Date().toISOString().split('T')[0];
            const premium = currentUser.premium || {};

            joinChannelBtn.disabled = premium.lastChannelClaim === today;
            joinChannelBtn.textContent = joinChannelBtn.disabled ? "Claimed Today" : "Join & Claim (+5 Points)";

            watchAdQuizBtn.disabled = (premium.adQuizClaims || 0) >= 3;
            watchAdQuizBtn.textContent = `Get +1 Quiz Limit (${3 - (premium.adQuizClaims || 0)}/day)`;
            
            watchAdEnergyBtn.disabled = (premium.adEnergyClaims || 0) >= 5;
            watchAdEnergyBtn.textContent = `Get +1 Energy (${5 - (premium.adEnergyClaims || 0)}/day)`;

            starsButtons.forEach(btn => {
                const type = btn.dataset.type;
                if (type === 'boost') btn.disabled = (premium.boostPurchasesToday || 0) >= 7;
                else if (type === 'day') btn.disabled = (premium.dayPurchasesToday || 0) >= 1;
                else if (type === 'week') btn.disabled = premium.weeklyPremium?.active === true;
            });
        }

        function updateHistoryUI() {
            pointsHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">Loading history...</p>';
            if (currentUser.history) {
                const historyEntries = Object.values(currentUser.history).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                if(historyEntries.length > 0) {
                    pointsHistoryContainer.innerHTML = '';
                    historyEntries.forEach(entry => {
                        const item = document.createElement('div');
                        item.className = 'history-item';
                        const pointsClass = entry.points > 0 ? 'positive' : 'negative';
                        const sign = entry.points > 0 ? '+' : '';
                        item.innerHTML = `<div class="history-item-details"><span class="history-source">${entry.source}</span><span class="history-date">${new Date(entry.timestamp).toLocaleString()}</span></div><span class="history-points ${pointsClass}">${sign}${entry.points}</span>`;
                        pointsHistoryContainer.appendChild(item);
                    });
                } else {
                    pointsHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">No points history yet.</p>';
                }
            } else {
                 pointsHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">No points history yet.</p>';
            }

            withdrawalHistoryContainer.innerHTML = '<p style="text-align:center; color: var(--text-gray);">Loading withdrawals...</p>';
            db.ref('withdrawals').orderByChild('userId').equalTo(currentUser.id).once('value', snapshot => {
                 if (snapshot.exists()) {
                    withdrawalHistoryContainer.innerHTML = '';
                    const withdrawalEntries = Object.values(snapshot.val()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    withdrawalEntries.forEach(entry => {
                        const item = document.createElement('div');
                        item.className = 'history-item';
                        item.innerHTML = `<div class="history-item-details"><span class="history-source">${entry.amount} Pts via ${entry.method}</span><span class="history-date">${new Date(entry.timestamp).toLocaleString()}</span></div><span class="status status-${entry.status}">${entry.status}</span>`;
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
                if (btn.dataset.usd === "0.1" && currentUser.usedFirstWithdrawal) {
                    btn.disabled = true;
                    btn.textContent = "740 P (Used)";
                }
            });
        }
        
        function navigateTo(targetId) {
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            navButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.nav-btn[data-target="${targetId}"]`).classList.add('active');
            mainContent.scrollTop = 0;
            if (targetId === 'history-section') {
                updateHistoryUI();
            }
        }
        navButtons.forEach(button => button.addEventListener('click', () => navigateTo(button.dataset.target)));

        startQuizBtn.addEventListener('click', () => {
            if (currentUser.quizLimit <= 0) return showModal("No Quizzes Left", "You've used all your quizzes for today. Get more in the Premium section or come back tomorrow!");
            if (currentUser.energy <= 0) return showModal("Out of Energy", "You need energy to play. Get more by watching ads or come back tomorrow.");
            startQuiz();
        });

        function startQuiz() {
            quizHome.classList.add('hidden');
            quizGame.classList.remove('hidden');
            loadNextQuestion();
        }
        
        function loadNextQuestion() {
            if (currentUser.quizLimit <= 0) return endQuiz("Quiz Limit Reached", "You've finished your quizzes for today!");
            
            const playedIds = currentUser.playedQuizIds ? Object.keys(currentUser.playedQuizIds) : [];
            const availableQuestions = quizQuestions.filter((q, index) => !playedIds.includes(index.toString()));
            
            if (availableQuestions.length === 0) return endQuiz("Congratulations!", "You have answered all available questions!");

            const questionIndex = Math.floor(Math.random() * availableQuestions.length);
            currentQuestion = availableQuestions[questionIndex];
            const originalIndex = quizQuestions.indexOf(currentQuestion);
            db.ref(`users/${currentUser.id}/playedQuizIds/${originalIndex}`).set(true);

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
            timerBar.style.transition = 'none';
            timerBar.style.width = '100%';
            void timerBar.offsetWidth;
            timerBar.style.transition = `width ${QUIZ_TIME_LIMIT}s linear`;
            timerBar.style.animation = `gradient-shift ${QUIZ_TIME_LIMIT}s linear`;
            timerBar.style.width = '0%';

            quizTimer = setInterval(() => {
                clearInterval(quizTimer);
                handleAnswer(null);
            }, QUIZ_TIME_LIMIT * 1000);
        }
        
        function handleAnswer(selectedOption) {
            clearInterval(quizTimer);
            timerBar.style.animation = 'none';
            optionsContainer.querySelectorAll('.option-btn').forEach(btn => btn.classList.add('disabled'));

            const isCorrect = selectedOption === currentQuestion.answer;
            let pointsEarned = isCorrect ? 5 : 1;
            let updates = {
                points: (currentUser.points || 0) + pointsEarned,
                quizLimit: Math.max(0, (currentUser.quizLimit || 0) - 1)
            };
            
            feedbackTitle.textContent = isCorrect ? "Congratulations!" : "Oops!";
            if(isCorrect) {
                feedbackText.textContent = `You win ${pointsEarned} points.`;
            } else {
                updates.energy = Math.max(0, (currentUser.energy || 0) - 1);
                feedbackText.innerHTML = `The correct answer was <strong>${currentQuestion.answer}</strong>. Better luck next time! You win ${pointsEarned} point.`;
            }
            
            logHistory(isCorrect ? 'Quiz Win' : 'Quiz Loss', pointsEarned);
            db.ref('users/' + currentUser.id).update(updates);

            optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
                if (btn.textContent === currentQuestion.answer) btn.classList.add('correct');
                else if (btn.textContent === selectedOption) btn.classList.add('wrong');
            });
            setTimeout(() => quizFeedback.classList.remove('hidden'), 1000);
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
            if (typeof show_9405037 === 'function') {
                show_9405037().then(() => {
                    let updates = {}, message = "";
                    if (type === 'quiz') {
                        updates['premium/adQuizClaims'] = (currentUser.premium.adQuizClaims || 0) + 1;
                        updates.quizLimit = (currentUser.quizLimit || 0) + 1;
                        message = "You've received +1 Quiz Limit for today!";
                        logHistory('Ad Reward (Quiz)', 0);
                    } else if (type === 'energy') {
                        updates['premium/adEnergyClaims'] = (currentUser.premium.adEnergyClaims || 0) + 1;
                        updates.energy = (currentUser.energy || 0) + 1;
                        message = "You've received +1 Energy!";
                        logHistory('Ad Reward (Energy)', 0);
                    }
                    db.ref('users/' + currentUser.id).update(updates);
                    showModal("Reward Granted!", message);
                }).catch(error => showModal("Ad Not Available", "The ad could not be shown. Please try again later."));
            } else {
                 showModal("Ad SDK Error", "The ad functionality is not available right now.");
            }
        }
        
        watchAdQuizBtn.addEventListener('click', () => watchAdForReward('quiz'));
        watchAdEnergyBtn.addEventListener('click', () => watchAdForReward('energy'));

        starsButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                let stars, payload, text;
                if (type === 'boost') { stars = 1; payload = 'boost_1'; text = 'Pay ★1 for +1 extra quiz today?'; }
                else if (type === 'day') { stars = 15; payload = 'day_premium_15'; text = 'Pay ★15 for the Day Premium?'; }
                else if (type === 'week') { stars = 100; payload = 'weekly_premium_100'; text = 'Pay ★100 for the Weekly Premium?'; }
                else return;
                
                tg.showConfirm(text, (ok) => {
                    if (ok) tg.openInvoice(`invoice_${payload}_${Date.now()}`, (status) => {
                        if (status === 'paid') showModal("Payment Successful!", "Your premium features are being activated.");
                        else if (status === 'failed') showModal("Payment Failed", "The transaction could not be completed.");
                    });
                });
            });
        });

        copyReferralBtn.addEventListener('click', () => navigator.clipboard.writeText(referralLinkInput.value).then(() => showModal("Copied!", "Referral link copied.")));
        shareReferralBtn.addEventListener('click', () => tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLinkInput.value)}&text=${encodeURIComponent("Join Auiz Aarn Bot and earn points!")}`));
        submitReferralBtn.addEventListener('click', () => submitReferralCode(submitReferralInput.value.trim(), false));

        function submitReferralCode(code, fromStartParam = false) {
            if (!code || currentUser.usedReferralCode || code === currentUser.referralCode) return;
            const usersRef = db.ref('users');
            usersRef.orderByChild('referralCode').equalTo(code).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    const referrerId = Object.keys(snapshot.val())[0];
                    const referrerData = snapshot.val()[referrerId];
                    db.ref(`users/${currentUser.id}`).update({ points: (currentUser.points || 0) + 5, usedReferralCode: true, referredBy: referrerId });
                    logHistory('Referral Bonus', 5, currentUser.id);
                    db.ref(`users/${referrerId}`).update({ points: (referrerData.points || 0) + 10, totalReferrals: (referrerData.totalReferrals || 0) + 1 });
                    logHistory(`Referred ${currentUser.username}`, 10, referrerId);
                    showModal("Success!", "You've received 5 points! Your friend has received 10 points.");
                } else if(!fromStartParam) {
                    showModal("Invalid Code", "That referral code does not exist.");
                }
            });
        }

        historyToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                historyToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.history-container').forEach(c => c.classList.add('hidden'));
                document.getElementById(btn.dataset.target).classList.remove('hidden');
            });
        });

        withdrawOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('withdraw-btn') && !e.target.disabled) {
                withdrawAmountText.textContent = `${e.target.dataset.points} Points ($${e.target.dataset.usd})`;
                withdrawForm.dataset.points = e.target.dataset.points;
                withdrawForm.dataset.isFirst = (e.target.dataset.usd === "0.1");
                withdrawFormContainer.classList.remove('hidden');
            }
        });

        paymentMethodRadios.forEach(radio => radio.addEventListener('change', () => paymentAddressInput.placeholder = radio.value === 'TON' ? "Enter your TON wallet address (e.g., UQ...)" : "Enter your Binance Pay ID (e.g., 123456789)"));

        withdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pointsToWithdraw = parseInt(withdrawForm.dataset.points);
            const address = paymentAddressInput.value.trim();
            if (!address) return showModal("Missing Information", "Please enter your payment address or ID.");
            const withdrawalId = `wd_${currentUser.id}_${Date.now()}`;
            const request = {
                id: withdrawalId, userId: currentUser.id, username: currentUser.username,
                amount: pointsToWithdraw, method: document.querySelector('input[name="payment-method"]:checked').value,
                address: address, status: 'Pending', timestamp: new Date().toISOString()
            };
            db.ref('withdrawals/' + withdrawalId).set(request);
            let userUpdates = { points: currentUser.points - pointsToWithdraw };
            if (withdrawForm.dataset.isFirst === "true") userUpdates.usedFirstWithdrawal = true;
            db.ref('users/' + currentUser.id).update(userUpdates);
            logHistory(`Withdrawal Request`, -pointsToWithdraw);
            showModal("Request Submitted", `Your withdrawal request for ${pointsToWithdraw} points is pending review.`);
            withdrawFormContainer.classList.add('hidden');
            withdrawForm.reset();
        });

        function showModal(title, text) {
            modalTitle.textContent = title;
            modalText.innerHTML = text;
            modal.classList.remove('hidden');
        }

        modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
        
        function logHistory(source, points, targetUserId = null) {
            const userId = targetUserId || currentUser.id;
            db.ref(`users/${userId}/history`).push().set({ source, points, timestamp: new Date().toISOString() });
        }

        initializeUser();

    } catch (error) {
        // This will catch any major error during initial setup
        document.getElementById('loader-overlay').innerHTML = `<p style="color: #ff3b30; padding: 20px;">A critical error occurred: ${error.message}. Please restart the app.</p>`;
    }
});
