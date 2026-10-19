const calendar = document.querySelector('#calendar');
const sessionState = { chloe: {}, brian: {} };
const notesState = { chloe: {}, brian: {} };
const storageKey = 'stride-tracker-data';
const workouts = {
  chloe: { name: 'Squats', detail: '10 reps · bodyweight', duration: '10 REPS' },
  brian: { name: 'Press ups', detail: '10 reps · bodyweight', duration: '10 REPS' },
};
const startDate = new Date('2026-10-18T12:00:00');
const dates = Array.from({ length: 31 }, (_, index) => {
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + index);
  return date;
});
let activePerson = 'chloe';

function kenyaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).reduce((values, part) => {
    values[part.type] = part.value;
    return values;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

const todayKey = kenyaDateKey();
const todayIndex = dates.findIndex((date) => date.toISOString().slice(0, 10) === todayKey);
let selectedIndex = todayIndex >= 0 ? todayIndex : 0;

function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    Object.assign(sessionState.chloe, saved.sessions?.chloe || {});
    Object.assign(sessionState.brian, saved.sessions?.brian || {});
    Object.assign(notesState.chloe, saved.notes?.chloe || {});
    Object.assign(notesState.brian, saved.notes?.brian || {});
  } catch (error) {
    // Keep the tracker usable when browser storage is unavailable.
  }
}

function saveData() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ sessions: sessionState, notes: notesState }));
  } catch (error) {
    // Progress still works for the current page when storage is unavailable.
  }
}

function saveToday() {
  const dateKey = dates[selectedIndex].toISOString().slice(0, 10);
  const noteInput = document.querySelector('#extra-note-input');
  const note = noteInput ? noteInput.value.trim() : '';
  if (note) notesState[activePerson][dateKey] = note;
  else delete notesState[activePerson][dateKey];
  saveData();
  renderSessions('Saved just now');
}

function dateLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function updateProgress() {
  Object.keys(sessionState).forEach((person) => {
    const count = Object.values(sessionState[person]).filter(Boolean).length;
    const unlogged = 62 - count;
    const percent = Math.round((count / 62) * 100);
    document.querySelector(`#${person}-completion-value`).textContent = `${percent}%`;
    document.querySelector(`#${person}-completion-meter`).style.width = `${percent}%`;
    document.querySelector(`#${person}-completion-copy`).textContent = `${count} completed · ${unlogged} unlogged`;
  });
  document.querySelectorAll('.person').forEach((button) => {
    const count = Object.values(sessionState[button.dataset.person]).filter(Boolean).length;
    button.querySelector('.person-progress').textContent = `${count} done · ${62 - count} unlogged`;
  });
}

function renderSessions(saveMessage = '') {
  const date = dates[selectedIndex];
  const dateKey = date.toISOString().slice(0, 10);
  const workout = workouts[activePerson];
  const sessions = [
    { id: 'morning', label: '☼ MORNING', duration: workout.duration, title: workout.name, detail: workout.detail, time: '07:30 AM' },
    { id: 'evening', label: '☾ EVENING', duration: workout.duration, title: workout.name, detail: workout.detail, time: '06:15 PM' },
  ];
  document.querySelector('#selected-date-label').textContent = `${dateKey === todayKey ? 'TODAY · ' : ''}${dateLabel(date)}`;
  document.querySelector('#selected-day').textContent = date.getDate();
  document.querySelector('#session-panel').innerHTML = sessions.map((session, index) => {
    const completed = sessionState[activePerson][`${dateKey}-${session.id}`];
    return `<div class="session-card ${index === 0 ? 'morning' : 'evening'}"><div class="session-top"><span class="session-type">${session.label}</span><span class="duration">${session.duration}</span></div><h3>${session.title}</h3><p>${session.detail}</p><div class="session-footer"><span>${session.time}</span><button class="complete-button${completed ? ' completed' : ''}" data-session="${session.id}">${completed ? 'Completed' : 'Log after workout'} <span>✓</span></button></div></div>`;
  }).join('') + `<div class="extra-note"><div class="extra-note-heading"><span>OPTIONAL EXTRA</span><span>1 line is plenty</span></div><label for="extra-note-input">What else did you do today?</label><textarea id="extra-note-input" maxlength="140" placeholder="e.g. Walked home from work...">${notesState[activePerson][dateKey] || ''}</textarea><button class="save-note" type="button">Save note <span>↗</span></button></div><div class="save-day-row"><button class="save-day-button${saveMessage ? ' saved' : ''}" id="save-day-button" type="button">${saveMessage ? 'Changes saved' : "Save today's workout"} <span>✓</span></button><span class="save-status">${saveMessage || 'Changes save automatically'}</span></div>`;
  document.querySelectorAll('.complete-button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = `${dateKey}-${button.dataset.session}`;
      if (sessionState[activePerson][key]) delete sessionState[activePerson][key];
      else sessionState[activePerson][key] = true;
      saveData();
      renderSessions();
      renderCalendar(activePerson);
      updateProgress();
    });
  });
  document.querySelector('.save-note').addEventListener('click', () => {
    const note = document.querySelector('#extra-note-input').value.trim();
    if (note) notesState[activePerson][dateKey] = note;
    else delete notesState[activePerson][dateKey];
    saveData();
    const saveNoteButton = document.querySelector('.save-note');
    saveNoteButton.classList.add('saved');
    saveNoteButton.innerHTML = 'Note saved <span>✓</span>';
  });
  document.querySelector('#save-day-button').addEventListener('click', saveToday);
}

function renderCalendar(person = activePerson) {
  calendar.innerHTML = '';
  const workout = workouts[person];
  dates.forEach((date, index) => {
    const card = document.createElement('div');
    const dateKey = date.toISOString().slice(0, 10);
    const completedMorning = sessionState[person][`${dateKey}-morning`];
    const completedEvening = sessionState[person][`${dateKey}-evening`];
    const today = dateKey === todayKey;
    card.className = `day${today ? ' today' : ''}${index === selectedIndex ? ' selected-day' : ''}`;
    card.setAttribute('tabindex', '0');
    card.innerHTML = `<div class="day-number"><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span>${today ? '<span class="today-label">TODAY</span>' : ''}</div>
      <div class="session-pill ${completedMorning ? 'done' : 'planned'}">${completedMorning ? 'AM · DONE' : `AM · ${workout.name}`}</div>
      <div class="session-pill ${completedEvening ? 'done' : 'planned'}">${completedEvening ? 'PM · DONE' : `PM · ${workout.name}`}</div>`;
    card.addEventListener('click', () => { selectedIndex = index; renderCalendar(activePerson); renderSessions(); });
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter') card.click(); });
    calendar.appendChild(card);
  });
}

document.querySelectorAll('.person').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.person').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    activePerson = button.dataset.person;
    renderCalendar(activePerson);
    renderSessions();
  });
});

document.querySelectorAll('.view-toggle button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.view-toggle button').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
  });
});

loadSavedData();
renderCalendar();
renderSessions();
updateProgress();