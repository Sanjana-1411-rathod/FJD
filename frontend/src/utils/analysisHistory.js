const STORAGE_KEY = 'authentijob_analysis_history';

export const saveAnalysis = (result, tab, inputText = '') => {
  try {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      tab,
      verdict: result.verdict || (result.isSafe === false ? 'Fake' : result.isSafe === true ? 'Genuine' : 'Unknown'),
      score: result.score ?? result.matchScore ?? null,
      riskLevel: result.riskLevel || null,
      inputPreview: inputText?.slice(0, 80) || '',
    };
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    console.warn('Could not save analysis history', e);
  }
};

export const getHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
