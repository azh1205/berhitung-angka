// Game State
let score = 0;
let health = 5;
let level = 1;
let currentAnswer = 0;
let gameActive = false;

// DOM Elements
const scoreDisplay = document.getElementById('score-display');
const healthDisplay = document.getElementById('health-display');
const questionText = document.getElementById('question-text');
const playArea = document.getElementById('play-area');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreDisplay = document.getElementById('final-score');

// Initialize Game
function initGame() {
    score = 0;
    health = 5;
    level = 1;
    updateUIScore();
    renderHealth();
    startOverlay.classList.remove('active');
    gameOverOverlay.classList.remove('active');
    gameActive = true;
    nextQuestion();
}

function updateUIScore() {
    scoreDisplay.innerText = score;
}

function renderHealth() {
    healthDisplay.innerHTML = '';
    for(let i=0; i<5; i++) {
        const heart = document.createElement('i');
        heart.className = i < health ? 'fa-solid fa-heart' : 'fa-solid fa-heart lost';
        healthDisplay.appendChild(heart);
    }
}

function nextQuestion() {
    if(!gameActive) return;
    
    // Scale Difficulty based on score (every 3 score = 1 level up approximately)
    level = Math.floor(score / 3) + 1;
    
    let a, b, operator, questionStr;
    
    if (level === 1) { // simple addition < 10
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        operator = '+';
        currentAnswer = a + b;
    } else if (level === 2) { // addition < 20 or minus
        const isMinus = Math.random() > 0.4; // 40% chance minus
        if(isMinus) {
            a = Math.floor(Math.random() * 15) + 5;
            b = Math.floor(Math.random() * (a-1)) + 1;
            operator = '-';
            currentAnswer = a - b;
        } else {
            a = Math.floor(Math.random() * 15) + 1;
            b = Math.floor(Math.random() * 15) + 1;
            operator = '+';
            currentAnswer = a + b;
        }
    } else { // higher levels: bigger add/sub or multiplication
        const type = Math.floor(Math.random() * 3);
        if(type === 0) { // multiplication
            const multiplierMax = Math.min(10, level * 2);
            a = Math.floor(Math.random() * multiplierMax) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            operator = 'x';
            currentAnswer = a * b;
        } else if (type === 1) { // bigger minus
            a = Math.floor(Math.random() * (20 + level * 5)) + 10;
            b = Math.floor(Math.random() * (a-1)) + 1;
            operator = '-';
            currentAnswer = a - b;
        } else { // bigger add
            a = Math.floor(Math.random() * (20 + level * 5)) + 10;
            b = Math.floor(Math.random() * (20 + level * 5)) + 10;
            operator = '+';
            currentAnswer = a + b;
        }
    }
    
    questionStr = `${a} ${operator} ${b} = ?`;
    questionText.innerText = questionStr;
    
    // Animate question popup
    questionText.classList.remove('pop');
    void questionText.offsetWidth; // trigger reflow to restart animation
    questionText.classList.add('pop');
    
    generateBubbles();
}

function generateBubbles() {
    playArea.innerHTML = ''; // clear area for new bubbles
    
    // Create 4 false answers close to the real answer
    let answers = [currentAnswer];
    while(answers.length < 5) {
        // offset logic depending on level to keep it tricky
        let maxOffset = Math.max(5, Math.floor(currentAnswer * 0.2)); 
        let offset = Math.floor(Math.random() * (maxOffset * 2 + 1)) - maxOffset;
        if(offset === 0) offset = 1;
        
        let wrongAns = currentAnswer + offset;
        
        // Ensure no negative answers if original answer is positive (for simplicity)
        if(currentAnswer >= 0 && wrongAns < 0) {
            wrongAns = Math.abs(wrongAns) + 1;
        }
        
        if(!answers.includes(wrongAns)) {
            answers.push(wrongAns);
        }
    }
    
    // Shuffle answers
    answers.sort(() => Math.random() - 0.5);
    
    // Create DOM elements
    const colors = ['c1', 'c2', 'c3', 'c4', 'c5'];
    
    answers.forEach((ans, index) => {
        createBubble(ans, colors[index % colors.length]);
    });
}

function createBubble(number, colorClass) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${colorClass}`;
    bubble.innerText = number;
    
    const size = 90;
    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;
    
    // Ensure padding from edges
    const safeMaxX = Math.max(0, maxX - 20);
    const safeMaxY = Math.max(0, maxY - 20);
    
    const startX = Math.random() * safeMaxX;
    
    // Avoid top 250px where header and question are usually located
    const minY = Math.min(250, window.innerHeight * 0.3);
    const startY = minY + Math.random() * Math.max(0, safeMaxY - minY);
    
    bubble.style.left = `${startX}px`;
    bubble.style.top = `${startY}px`;
    
    // Randomize floating animation
    const animName = Math.random() > 0.5 ? 'floatAnim1' : 'floatAnim2';
    const animDur = (Math.random() * 5 + 4) + 's'; // 4s to 9s duration
    bubble.style.animation = `${animName} ${animDur} infinite ease-in-out alternate`;
    
    // Interaction
    const handleDown = (e) => {
        if(e.cancelable) e.preventDefault(); // prevent touch double events
        handleAnswer(number, bubble);
    };
    
    // Use touchstart and pointerdown for immediate interaction on mobile and desktop
    bubble.addEventListener('pointerdown', handleDown);
    
    playArea.appendChild(bubble);
}

function handleAnswer(ans, bubbleElement) {
    if(!gameActive) return;
    
    if(ans === currentAnswer) {
        // CORRECT
        score++;
        updateUIScore();
        
        // Visual feedback on bubble
        bubbleElement.classList.add('disappear');
        // Prevent further clicking on screen during transition
        playArea.style.pointerEvents = 'none';
        
        setTimeout(() => {
            playArea.style.pointerEvents = 'all';
            nextQuestion();
        }, 300); // Wait 300ms for disappearance animation
        
    } else {
        // WRONG
        // Only deduct if not already animating this specific bubble as wrong
        if (bubbleElement.dataset.wrong === "true") return;
        bubbleElement.dataset.wrong = "true";
        
        health--;
        renderHealth();
        
        // Error feedback on question text
        questionText.classList.remove('shake');
        void questionText.offsetWidth; // reflow
        questionText.classList.add('shake');
        
        // Error on bubble (turn gray)
        bubbleElement.style.background = 'radial-gradient(circle at 30% 30%, #64748b, #334155)';
        bubbleElement.style.opacity = '0.7';
        bubbleElement.style.pointerEvents = 'none';
        bubbleElement.style.transform = 'scale(0.85)';
        
        if (health <= 0) {
            endGame();
        }
    }
}

function endGame() {
    gameActive = false;
    finalScoreDisplay.innerText = score;
    gameOverOverlay.classList.add('active');
    // Stop animations and interactions in play area
    playArea.innerHTML = ''; 
}

// Event Listeners
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Handle window resize nicely by repositioning bubbles if they are out of bounds
window.addEventListener('resize', () => {
    if(!gameActive) return;
    const bubbles = document.querySelectorAll('.bubble');
    const maxX = window.innerWidth - 90;
    const maxY = window.innerHeight - 90;
    bubbles.forEach(b => {
        const currentX = parseInt(b.style.left, 10);
        const currentY = parseInt(b.style.top, 10);
        if(currentX > maxX) b.style.left = `${maxX}px`;
        if(currentY > maxY) b.style.top = `${maxY}px`;
    });
});
