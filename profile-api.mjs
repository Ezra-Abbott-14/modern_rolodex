// Keep transport errors separate from Gemini errors and invalid response data.
export async function extractProfile(note, fetcher = globalThis.fetch, page = globalThis.location) {
  const wrongServer = () => Object.assign(new Error(
    'This page is a static preview. Open http://localhost:8000 instead of Live Server (port 5500). Your note has not been cleared.'
  ), {code: 'WRONG_SERVER'});
  if (page?.protocol === 'file:') throw wrongServer();
  // VS Code Live Server serves the UI only. Route its API call to Python.
  const liveServer = page?.protocol === 'http:' && page.port === '5500'
    && ['localhost', '127.0.0.1'].includes(page.hostname);
  const endpoint = liveServer ? `http://${page.hostname}:8000/api/profile` : '/api/profile';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    let response;
    try {
      response = await fetcher(endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({note}), signal: controller.signal
      });
    } catch (error) {
      if (controller.signal.aborted || error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Profile extraction timed out. Your note is still here; please retry.');
      }
      throw Object.assign(new Error('The Rolodexi backend could not be reached. Keep the terminal running with ./start.ps1 or python server.py, then retry. Your note is still here.'), {code: 'BACKEND_UNREACHABLE'});
    }
    if (!response.headers.get('content-type')?.includes('application/json')) throw wrongServer();
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error('The profile service returned unreadable data. Your note is still here; please retry.'); }
    if (!response.ok) {
      if (response.status === 404 || response.status === 405 || response.status === 501) throw wrongServer();
      throw new Error(typeof payload?.error === 'string' ? payload.error : 'Profile extraction failed. Please try again.');
    }
    const profile = payload?.profile;
    const fields = ['name', 'role', 'met', 'city', 'phone', 'email', 'notes', 'gender', 'pronouns', 'appearance'];
    if (!profile || fields.some(field => typeof profile[field] !== 'string') ||
        ['events', 'tags'].some(field => !Array.isArray(profile[field]) || profile[field].some(value => typeof value !== 'string'))) {
      throw new Error('The profile service returned an invalid profile. Your note is still here; please retry.');
    }
    if (!profile.name.trim()) throw new Error('No person was found. Please include their name.');
    return profile;
  } finally { clearTimeout(timer); }
}

// Some branches intentionally hide optional fields such as pronouns.
export function populateProfileForm(form, profile) {
  for (const name of ['name', 'role', 'met', 'city', 'phone', 'email', 'notes', 'gender', 'pronouns', 'appearance']) {
    const control = form.elements.namedItem(name);
    if (control) control.value = profile[name] || '';
  }
  for (const name of ['events', 'tags']) {
    const control = form.elements.namedItem(name);
    if (control) control.value = (profile[name] || []).join(name === 'tags' ? ', ' : '\n');
  }
}
