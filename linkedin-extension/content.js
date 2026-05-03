// AuthentiJob LinkedIn Extension - Content Script
console.log("AuthentiJob Extension Loaded");

// ── Inject popup HTML once ─────────────────────────────────────
function injectPopup() {
  if (document.getElementById('aj-popup')) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div id="aj-popup" style="display:none;">
      <div id="aj-header">
        <span id="aj-logo">🛡️ AuthentiJob</span>
        <button id="aj-close">✕</button>
      </div>
      <div id="aj-body">
        <div id="aj-scanning" style="display:none;">
          <div id="aj-spinner"></div>
          <p>AI analyzing job posting...</p>
        </div>
        <div id="aj-result" style="display:none;">
          <div id="aj-verdict-row">
            <div id="aj-score-circle"><span id="aj-score-num">0</span><span id="aj-score-label">Risk</span></div>
            <div>
              <div id="aj-verdict-text"></div>
              <div id="aj-risk-badge"></div>
            </div>
          </div>
          <div id="aj-explanation"></div>
          <a id="aj-open-app" href="http://localhost:5174/analyzer" target="_blank">Open in AuthentiJob App →</a>
        </div>
        <div id="aj-error" style="display:none;">
          <p id="aj-error-msg"></p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  document.getElementById('aj-close').onclick = () => {
    document.getElementById('aj-popup').style.display = 'none';
  };
}

// ── Inject scan button on LinkedIn ────────────────────────────
function addAnalyzeButton() {
  if (document.getElementById('authentijob-btn')) return;
  const actionsContainer = document.querySelector('.jobs-apply-button--top-card') ||
                           document.querySelector('.jobs-s-apply') ||
                           document.querySelector('[data-job-id]');
  if (!actionsContainer) return;

  const btn = document.createElement('button');
  btn.id = 'authentijob-btn';
  btn.innerHTML = '🛡️ Scan Job';
  btn.onclick = scanJob;
  actionsContainer.parentNode.insertBefore(btn, actionsContainer.nextSibling);
}

// ── Main scan logic ────────────────────────────────────────────
async function scanJob() {
  injectPopup();
  const popup   = document.getElementById('aj-popup');
  const scanning = document.getElementById('aj-scanning');
  const result  = document.getElementById('aj-result');
  const errorDiv = document.getElementById('aj-error');

  popup.style.display = 'block';
  scanning.style.display = 'flex';
  result.style.display = 'none';
  errorDiv.style.display = 'none';

  const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText ||
                   document.querySelector('h1')?.innerText || '';
  const company  = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText ||
                   document.querySelector('.jobs-unified-top-card__company-name')?.innerText || '';
  const jobDesc  = document.querySelector('#job-details')?.innerText ||
                   document.querySelector('.jobs-description')?.innerText || '';
  const salary   = document.querySelector('.compensation__salary')?.innerText || '';

  const fullText = [jobTitle, company, salary, jobDesc].filter(Boolean).join('\n');

  try {
    const res = await fetch('http://localhost:5000/api/analyze/job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText })
    });

    const data = await res.json();
    scanning.style.display = 'none';

    if (data.error) {
      showError('API Error: ' + data.error);
      return;
    }

    // Populate result
    const score = data.score || 0;
    const verdict = data.verdict || 'Unknown';

    document.getElementById('aj-score-num').textContent = score;

    const scoreCircle = document.getElementById('aj-score-circle');
    if (score >= 70) {
      scoreCircle.style.borderColor = '#ef4444';
      scoreCircle.style.color = '#ef4444';
    } else if (score >= 35) {
      scoreCircle.style.borderColor = '#f59e0b';
      scoreCircle.style.color = '#f59e0b';
    } else {
      scoreCircle.style.borderColor = '#10b981';
      scoreCircle.style.color = '#10b981';
    }

    const verdictEl = document.getElementById('aj-verdict-text');
    verdictEl.textContent = verdict === 'Fake' ? '⚠️ Likely Scam' : verdict === 'Suspicious' ? '🟡 Suspicious' : '✅ Looks Genuine';
    verdictEl.style.color = verdict === 'Fake' ? '#ef4444' : verdict === 'Suspicious' ? '#f59e0b' : '#10b981';

    const badge = document.getElementById('aj-risk-badge');
    badge.textContent = (data.riskLevel || '') + ' Risk';
    badge.style.background = score >= 70 ? 'rgba(239,68,68,0.15)' : score >= 35 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)';
    badge.style.color = score >= 70 ? '#ef4444' : score >= 35 ? '#f59e0b' : '#10b981';

    document.getElementById('aj-explanation').textContent = data.explanation || '';

    result.style.display = 'block';

  } catch (err) {
    scanning.style.display = 'none';
    showError('Backend not running. Start it on port 5000 first.');
  }
}

function showError(msg) {
  document.getElementById('aj-error-msg').textContent = msg;
  document.getElementById('aj-error').style.display = 'block';
}

// ── Observe LinkedIn SPA navigation ───────────────────────────
const observer = new MutationObserver(addAnalyzeButton);
observer.observe(document.body, { childList: true, subtree: true });
addAnalyzeButton();
