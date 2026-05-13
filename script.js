// Cyberpunk Password Generator (Clean, Manual Generation Only)

const el = (id) => document.getElementById(id);
const passwordInput = el("passwordInput");
const lengthSlider = el("lengthSlider");
const lengthValue = el("lengthValue");
const strengthBar = el("strengthBar");
const strengthLabel = el("strengthLabel");
const entropyValue = el("entropyValue");
const crackTime = el("crackTime");
const analysisText = el("analysisText");
const levelFill = el("levelFill");
const toast = el("toast");
const generateBtn = el("generateBtn");
const statusText = el("statusText");
const scanAnim = el("scanAnim");
const modeSelect = el("modeSelect");

const options = {
  upper: el("optUpper"),
  lower: el("optLower"),
  numbers: el("optNumbers"),
  symbols: el("optSymbols"),
  excludeSimilar: el("optExcludeSimilar"),
  noRepeat: el("optNoRepeat"),
};

const quotes = [
  "Trust no one. Encrypt everything.",
  "Entropy is the heartbeat of security.",
  "Zero trust isn't a slogan, it's survival.",
  "Complexity without randomness is illusion.",
  "Rotate keys like you rotate your secrets."
];

const wordBank = [
  "Shadow","Nova","Cipher","Falcon","Tiger","Vortex","Quantum","Blade","Specter","Neon",
  "Rogue","Apex","Signal","Matrix","Ghost","Titan","Vector","Orbit","Pulse","Echo",
  "Hyper","Ion","Drift","Zenith","Storm","Phantom","Lumen","Rift","Obsidian","Nexus"
];

const similarChars = /[O0l1I]/g;
const symbols = "!@#$%^&*()-_=+[]{};:,.<>/?|~";

/** Toast notification */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

/** Random helpers */
function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build character pool for random/fill */
function getAllowedPool() {
  let pool = "";
  if (options.upper.checked) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.lower.checked) pool += "abcdefghijklmnopqrstuvwxyz";
  if (options.numbers.checked) pool += "0123456789";
  if (options.symbols.checked) pool += symbols;
  if (options.excludeSimilar.checked) pool = pool.replace(similarChars, "");
  return pool;
}

/** Generate random password */
function generateRandomPassword(len) {
  const pool = getAllowedPool();
  if (!pool) return "";
  if (options.noRepeat.checked && len > pool.length) return "";

  let password = "";
  const used = new Set();
  while (password.length < len) {
    const ch = pool[Math.floor(Math.random() * pool.length)];
    if (options.noRepeat.checked && used.has(ch)) continue;
    used.add(ch);
    password += ch;
  }
  return password;
}

/** Generate memorable password */
function generateMemorablePassword(len) {
  if (!options.upper.checked && !options.lower.checked) return "";

  const wordCount = len >= 18 ? 3 : 2;
  const words = [];
  while (words.length < wordCount) {
    const w = randItem(wordBank);
    if (!words.includes(w)) words.push(w);
  }

  const styledWords = words.map((w) => {
    if (options.upper.checked && !options.lower.checked) return w.toUpperCase();
    if (!options.upper.checked && options.lower.checked) return w.toLowerCase();
    return w;
  });

  let joiner = "";
  if (options.symbols.checked) joiner = randItem(symbols.split(""));
  const base = styledWords.join(joiner);

  let password = base;

  if (options.numbers.checked) {
    password += String(randInt(10, 9999));
  } else if (options.symbols.checked && joiner === "") {
    password += randItem(symbols.split(""));
  }

  return applyPasswordRules(password, len);
}

/** Apply rules (exclude similar, no repeat) and validate length */
function applyPasswordRules(password, len) {
  let result = password;

  if (options.excludeSimilar.checked) {
    result = result.replace(similarChars, "");
  }

  if (options.noRepeat.checked) {
    const seen = new Set();
    result = [...result].filter((ch) => {
      if (seen.has(ch)) return false;
      seen.add(ch);
      return true;
    }).join("");
  }

  return validatePasswordLength(result, len);
}

/** Ensure length matches target */
function validatePasswordLength(password, len) {
  let result = password;
  const pool = getAllowedPool() || "abcdefghijklmnopqrstuvwxyz";

  if (options.noRepeat.checked && len > pool.length) return "";

  while (result.length < len) {
    const ch = pool[Math.floor(Math.random() * pool.length)];
    if (options.noRepeat.checked && result.includes(ch)) continue;
    result += ch;
  }

  if (result.length > len) {
    result = result.slice(0, len);
  }
  return result;
}

/** Update strength meter */
function updateStrengthMeter(password) {
  const poolSize = estimatePoolSize(password);
  const entropy = password ? Math.round(password.length * Math.log2(poolSize)) : 0;

  entropyValue.textContent = entropy;
  crackTime.textContent = entropy ? crackTimeEstimate(entropy) : "—";

  const strength = strengthFromEntropy(entropy);
  strengthBar.style.width = `${strength.pct}%`;
  strengthBar.style.background = strength.color;
  strengthLabel.textContent = password ? `Strength: ${strength.label}` : "Strength: —";
  levelFill.style.width = `${strength.pct}%`;
}

/** Estimate pool size for strength calculation */
function estimatePoolSize(password) {
  if (!password) return 0;
  const mode = modeSelect.value;
  if (mode === "random") return getAllowedPool().length || 1;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /\d/.test(password);
  const hasSym = /[^A-Za-z0-9]/.test(password);

  let pool = 0;
  if (hasUpper) pool += 26;
  if (hasLower) pool += 26;
  if (hasNum) pool += 10;
  if (hasSym) pool += symbols.length;
  return Math.max(pool, 1);
}

/** Copy password */
async function copyPassword() {
  if (!passwordInput.value) return;
  await navigator.clipboard.writeText(passwordInput.value);
  showToast("Copied to clipboard");
}

/** Analyze password */
function analyzePassword(password) {
  if (!password) {
    analysisText.textContent = "Generate a password to view security analysis.";
    return;
  }
  const poolSize = estimatePoolSize(password);
  const entropy = Math.round(password.length * Math.log2(poolSize));
  const strength = strengthFromEntropy(entropy);

  analysisText.innerHTML = `
    <b>Strength:</b> ${strength.label}<br/>
    <b>Randomness:</b> ${entropy} bits of entropy.<br/>
    <b>Vulnerabilities:</b> ${entropy < 60 ? "Susceptible to brute-force within feasible time." : "Resistant to brute-force and pattern attacks."}
  `;
}

/** Crack time estimate */
function crackTimeEstimate(entropy) {
  const guessesPerSec = 1e9;
  const seconds = Math.pow(2, entropy) / guessesPerSec;
  if (seconds < 1) return "Instant";
  const units = [
    ["sec", 60],
    ["min", 60],
    ["hr", 24],
    ["day", 365],
    ["yr", 1000],
    ["ky", 1000],
    ["My", 1000],
    ["Gy", 1000],
  ];
  let t = seconds;
  let unit = "sec";
  for (const [u, div] of units) {
    unit = u;
    if (t < div) break;
    t /= div;
  }
  return `${t.toFixed(1)} ${unit}`;
}

/** Map entropy to strength */
function strengthFromEntropy(e) {
  if (e < 45) return { label: "Weak", pct: 25, color: "#ff4d6d" };
  if (e < 70) return { label: "Medium", pct: 50, color: "#ffd166" };
  if (e < 95) return { label: "Strong", pct: 75, color: "#06d6a0" };
  return { label: "Ultra Secure", pct: 100, color: "#4fd1ff" };
}

/** Handle generation with fake encryption animation */
function handleGenerate() {
  const len = parseInt(lengthSlider.value, 10);
  const pool = getAllowedPool();

  if (modeSelect.value === "random") {
    if (!pool) {
      showToast("Select at least one character set");
      return;
    }
    if (options.noRepeat.checked && len > pool.length) {
      showToast("Length exceeds unique characters available");
      return;
    }
  } else if (!options.upper.checked && !options.lower.checked) {
    showToast("Enable uppercase or lowercase for memorable mode");
    return;
  }

  generateBtn.classList.add("loading");
  generateBtn.textContent = "Encrypting Secure Key...";
  generateBtn.disabled = true;
  statusText.textContent = "Encrypting...";
  scanAnim.classList.add("active");

  setTimeout(() => {
    const password = modeSelect.value === "memorable"
      ? generateMemorablePassword(len)
      : generateRandomPassword(len);

    if (!password) {
      showToast("Unable to generate with current settings");
      generateBtn.classList.remove("loading");
      generateBtn.textContent = "Generate Password";
      generateBtn.disabled = false;
      statusText.textContent = "Ready";
      scanAnim.classList.remove("active");
      return;
    }

    passwordInput.value = password;
    updateStrengthMeter(password);
    analyzePassword(password);
    setQuote();

    generateBtn.classList.remove("loading");
    generateBtn.textContent = "Generate Password";
    generateBtn.disabled = false;
    statusText.textContent = "Ready";
    scanAnim.classList.remove("active");
    showToast("Password generated");
  }, 1400);
}

/** Random cyber tip */
function setQuote() {
  el("quoteText").textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

/** Toggle visibility */
function toggleVisibility() {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}

/** Initialize events */
function initEvents() {
  lengthSlider.addEventListener("input", () => {
    lengthValue.textContent = lengthSlider.value;
  });

  generateBtn.addEventListener("click", handleGenerate);
  el("copyBtn").addEventListener("click", copyPassword);
  el("toggleVisibility").addEventListener("click", toggleVisibility);
}

// Matrix background effect
function initMatrix() {
  const canvas = el("matrix");
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const cols = Math.floor(canvas.width / 16);
  const drops = Array(cols).fill(0);
  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(100,255,220,0.6)";
    ctx.font = "14px Share Tech Mono";
    for (let i = 0; i < drops.length; i++) {
      const text = String.fromCharCode(0x30A0 + Math.random() * 96);
      ctx.fillText(text, i * 16, drops[i] * 16);
      if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// Boot screen
function initBoot() {
  const boot = el("boot");
  setTimeout(() => {
    boot.style.opacity = "0";
    setTimeout(() => boot.remove(), 600);
  }, 2600);
}

// Init
initBoot();
initMatrix();
initEvents();
setQuote();
updateStrengthMeter("");
analyzePassword("");