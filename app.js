const calendar = document.querySelector('#calendar');
const sessionState = { chloe: {}, brian: {} };
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
let selectedIndex = 0;

function dateLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function updateProgress() {
  const total = Object.values(sessionState).reduce((sum, person) => sum + Object.keys(person).length, 0);
  const percent = Math.round((total / 124) * 100);
  document.querySelector('#completion-value').innerHTML = `${percent}<small>%</small>`;
  document.querySelector('#completion-meter').style.width = `${percent}%`;
  document.querySelector('#completion-copy').textContent = `${total} of 124 sessions completed`;
  document.querySelectorAll('.person').forEach((button) => {
    const count = Object.keys(sessionState[button.dataset.person]).length;
    button.querySelector('.person-progress').textContent = `${count} / 62 sessions`;
  });
}

function renderSessions() {
  const date = dates[selectedIndex];
  const dateKey = date.toISOString().slice(0, 10);
  const workout = workouts[activePerson];
  const sessions = [
    { id: 'morning', label: '☼ MORNING', duration: workout.duration, title: workout.name, detail: workout.detail, time: '07:30 AM' },
    { id: 'evening', label: '☾ EVENING', duration: workout.duration, title: workout.name, detail: workout.detail, time: '06:15 PM' },
  ];
  document.querySelector('#selected-date-label').textContent = `${selectedIndex === 0 ? 'TODAY · ' : ''}${dateLabel(date)}`;
  document.querySelector('#selected-day').textContent = date.getDate();
  document.querySelector('#session-panel').innerHTML = sessions.map((session, index) => {
    const completed = sessionState[activePerson][`${dateKey}-${session.id}`];
    return `<div class="session-card ${index === 0 ? 'morning' : 'evening'}"><div class="session-top"><span class="session-type">${session.label}</span><span class="duration">${session.duration}</span></div><h3>${session.title}</h3><p>${session.detail}</p><div class="session-footer"><span>${session.time}</span><button class="complete-button${completed ? ' completed' : ''}" data-session="${session.id}">${completed ? 'Completed' : 'Log after workout'} <span>✓</span></button></div></div>`;
  }).join('');
  document.querySelectorAll('.complete-button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = `${dateKey}-${button.dataset.session}`;
      sessionState[activePerson][key] = !sessionState[activePerson][key];
      renderSessions();
      renderCalendar(activePerson);
      updateProgress();
    });
  });
}

function renderCalendar(person = activePerson) {
  calendar.innerHTML = '';
  const workout = workouts[person];
  dates.forEach((date, index) => {
    const card = document.createElement('div');
    const dateKey = date.toISOString().slice(0, 10);
    const completedMorning = sessionState[person][`${dateKey}-morning`];
    const completedEvening = sessionState[person][`${dateKey}-evening`];
    const today = index === 0;
    card.className = `day${today ? ' today' : ''}${index === selectedIndex ? ' selected-day' : ''}`;
    card.setAttribute('tabindex', '0');
    card.innerHTML = `<div class="day-number"><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span>${today ? '<span class="today-label">START</span>' : ''}</div>
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

renderCalendar();
renderSessions();
updateProgress();