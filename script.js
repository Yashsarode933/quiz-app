let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let difficulty = "easy";
let questionTime = 15; // default
let category = "";      // Add this here so it’s defined globally
let maxQuestions = 10;   // max questions depending on difficulty

const timeElement = document.getElementById("time");
const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const resultContainer = document.getElementById("result");
const scoreElement = document.getElementById("score");
const restartButton = document.getElementById("restart-btn");

const quizContainer = document.getElementById("quiz");
const landingScreen = document.getElementById("landing-screen");
const startButton = document.getElementById("start-button");
const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");

const darkToggle = document.getElementById("dark-mode-toggle");

// Fetch questions from API with difficulty and category passed
async function fetchQuestions(difficulty, category) {
  const url = `https://opentdb.com/api.php?amount=${maxQuestions}&difficulty=${difficulty}&category=${category}&type=multiple`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    // Map and decode questions
    questions = data.results.map(q => ({
      question: decodeHTMLEntities(q.question),
      options: shuffle([...q.incorrect_answers, q.correct_answer].map(decodeHTMLEntities)),
      answer: decodeHTMLEntities(q.correct_answer)
    }));

    // Trim questions array based on maxQuestions set by difficulty
    if (questions.length > maxQuestions) {
      questions = questions.slice(0, maxQuestions);
    }

    currentQuestionIndex = 0;  // reset index
    score = 0;                 // reset score
    showQuestion();
  } catch (error) {
    console.error("Error fetching questions:", error);
    alert("Failed to load questions. Please try again.");
  }
}

function showQuestion() {
  if (!questions || currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
    console.error("Invalid question index or questions not loaded");
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];
  questionElement.textContent = currentQuestion.question;
  optionsElement.innerHTML = "";

  currentQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(button, currentQuestion.answer));
    optionsElement.appendChild(button);
  });
  
  document.getElementById("progress").textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  nextButton.style.display = "none";
  startTimer();
}

function selectAnswer(selectedButton, correctAnswer) {
  const isCorrect = selectedButton.textContent === correctAnswer;
  selectedButton.classList.add(isCorrect ? "correct" : "incorrect");

  if (isCorrect) score++;

  Array.from(optionsElement.children).forEach(button => {
    button.disabled = true;
    if (button.textContent === correctAnswer) {
      button.classList.add("correct");
    }
  });

  nextButton.style.display = "block";
  stopTimer();
}

nextButton.addEventListener("click", () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  quizContainer.classList.add("fade-out");
  setTimeout(() => {
    quizContainer.classList.add("hidden");
    quizContainer.classList.remove("fade-out");
    resultContainer.classList.remove("hidden");
    resultContainer.classList.add("fade-in");

    scoreElement.textContent = `${score} / ${questions.length}`;

    const scoreData = {
      score,
      total: questions.length,
      difficulty,
      date: new Date().toLocaleString()
    };
    let scoreHistory = JSON.parse(localStorage.getItem("quizScores")) || [];
    scoreHistory.push(scoreData);
    localStorage.setItem("quizScores", JSON.stringify(scoreHistory));
    renderScoreHistory();
  }, 500);
}

function renderScoreHistory() {
  const scoreHistory = JSON.parse(localStorage.getItem("quizScores")) || [];
  const historyList = document.getElementById("score-history");

  historyList.innerHTML = "";
  scoreHistory.slice().reverse().slice(0, 5).forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `Score: ${entry.score}/${entry.total} • ${entry.difficulty} • ${entry.date}`;
    historyList.appendChild(li);
  });
}

restartButton.addEventListener("click", () => {
  resultContainer.classList.add("fade-out");

  setTimeout(() => {
    resultContainer.classList.add("hidden");
    resultContainer.classList.remove("fade-out");

    landingScreen.classList.remove("hidden");
    landingScreen.classList.add("fade-in");

    // Reset quiz state
    score = 0;
    currentQuestionIndex = 0;
    scoreElement.textContent = "";
    clearInterval(timerInterval);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 500);
});

function startTimer() {
  timeLeft = questionTime;
  timeElement.textContent = timeLeft;
  timerInterval = setInterval(() => {
    timeLeft--;
    timeElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSkipQuestion();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function autoSkipQuestion() {
  Array.from(optionsElement.children).forEach(button => {
    button.disabled = true;
    if (button.textContent === questions[currentQuestionIndex].answer) {
      button.classList.add("correct");
    }
  });
  nextButton.style.display = "block";
}

// Called when user clicks Start
startButton.addEventListener("click", () => {
  category = categorySelect.value;       // assign global category variable
  difficulty = difficultySelect.value;   // assign global difficulty variable

  setDifficultySettings();

  // Fade out landing screen and fade in quiz
  landingScreen.classList.add("fade-out");
  setTimeout(() => {
    landingScreen.classList.add("hidden");
    landingScreen.classList.remove("fade-out");
    quizContainer.classList.remove("hidden");
    quizContainer.classList.add("fade-in");

    fetchQuestions(difficulty, category);
  }, 500);
});

function setDifficultySettings() {
  if (difficulty === "easy") {
    maxQuestions = 5;      // Only show 3 questions
    questionTime = 20;     // seconds per question
  } else if (difficulty === "medium") {
    maxQuestions = 7;
    questionTime = 15;
  } else if (difficulty === "hard") {
    maxQuestions = 10;
    questionTime = 10;
  } else {
    maxQuestions = 5;
    questionTime = 15;
  }
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function decodeHTMLEntities(text) {
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

// Check localStorage for saved preference
if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
  darkToggle.checked = true;
}

// Toggle theme
darkToggle.addEventListener("change", () => {
  if (darkToggle.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("darkMode", "enabled");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("darkMode", "disabled");
  }
});

// Remove this call because questions are fetched asynchronously now
// showQuestion();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => {
        console.log('Service Worker registered: ', reg.scope);
        console.log("Service Worker Updated");
      })
      .catch(err => {
        console.error('Service Worker registration failed: ', err);
      });
  });
}
