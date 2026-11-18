(() => {
  const settingsKey = 'ssait-sound-garden-v1';
  const layerNames = ['rain', 'wind', 'fire'];
  const sliders = Object.fromEntries(layerNames.map(name => [name, document.querySelector(`#${name}-level`)]));
  const outputs = Object.fromEntries(layerNames.map(name => [name, sliders[name].nextElementSibling]));
  const masterSlider = document.querySelector('#master-level');
  const timerSelect = document.querySelector('#sleep-timer');
  const consoleCard = document.querySelector('.sound-console');
  const toggle = document.querySelector('#sound-toggle');
  const status = document.querySelector('#sound-status');
  const timerLabel = document.querySelector('#sleep-remaining');
  let context;
  let masterGain;
  let layers = {};
  let crackleBuffer;
  let timerId;
  let stopTimeout;
  let crackleTimer;
  let sleepDeadline = 0;

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(settingsKey) || '{}') || {}; }
    catch { return {}; }
  }
  const saved = readSettings();

  for (const [name, slider] of Object.entries(sliders)) {
    const value = saved.levels?.[name];
    if (Number.isFinite(value)) slider.value = String(Math.max(0, Math.min(100, value)));
  }
  if (Number.isFinite(saved.master)) masterSlider.value = String(Math.max(0, Math.min(100, saved.master)));

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify({
        levels: Object.fromEntries(layerNames.map(name => [name, Number(sliders[name].value)])),
        master: Number(masterSlider.value),
        timer: Number(timerSelect.value)
      }));
    } catch {}
  }

  function makeNoise(type) {
    const length = context.sampleRate * 4;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .025 * white) / 1.025;
      data[i] = type === 'brown' ? brown * 3.5 : white * .72;
    }
    return buffer;
  }

  function addLayer(name) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = makeNoise(name === 'wind' ? 'brown' : 'white');
    source.loop = true;
    if (name === 'rain') {
      filter.type = 'bandpass'; filter.frequency.value = 2100; filter.Q.value = .55;
      gain.gain.value = 0;
    } else if (name === 'wind') {
      filter.type = 'lowpass'; filter.frequency.value = 390; filter.Q.value = .7;
      gain.gain.value = 0;
    } else {
      filter.type = 'bandpass'; filter.frequency.value = 1050; filter.Q.value = .9;
      gain.gain.value = 0;
    }
    source.connect(filter).connect(gain).connect(masterGain);
    source.start();
    return { source, filter, gain };
  }

  function ensureAudio() {
    if (context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Этот браузер не поддерживает создание звука.');
    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = Number(masterSlider.value) / 100;
    masterGain.connect(context.destination);
    layers = Object.fromEntries(layerNames.map(name => [name, addLayer(name)]));
  }

  function volumeCurve(value, name) {
    const level = value / 100;
    const ceiling = name === 'wind' ? .78 : name === 'fire' ? .52 : .68;
    return level === 0 ? 0 : ceiling * level * level;
  }

  function scheduleCrackle() {
    if (!context || !layers.fire || !consoleCard.classList.contains('is-playing')) return;
    if (Number(sliders.fire.value) > 0) {
      const now = context.currentTime;
      const duration = .035 + Math.random() * .055;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const burst = context.createGain();
      crackleBuffer ||= makeNoise('white');
      source.buffer = crackleBuffer;
      filter.type = 'bandpass'; filter.frequency.value = 1600 + Math.random() * 2300; filter.Q.value = 1.4;
      burst.gain.setValueAtTime(.0001, now);
      burst.gain.exponentialRampToValueAtTime(.12 + Math.random() * .22, now + .006);
      burst.gain.exponentialRampToValueAtTime(.0001, now + duration);
      source.connect(filter).connect(burst).connect(layers.fire.gain);
      source.start(now);
      source.stop(now + duration + .01);
    }
    crackleTimer = window.setTimeout(scheduleCrackle, 450 + Math.random() * 1450);
  }

  function updateLayer(name, instant = false) {
    if (!context || !layers[name]) return;
    const parameter = layers[name].gain.gain;
    const target = volumeCurve(Number(sliders[name].value), name);
    parameter.cancelScheduledValues(context.currentTime);
    if (instant) parameter.setValueAtTime(target, context.currentTime);
    else parameter.setTargetAtTime(target, context.currentTime, .18);
  }

  function renderLevels() {
    for (const name of layerNames) {
      outputs[name].value = `${sliders[name].value}%`;
      outputs[name].textContent = `${sliders[name].value}%`;
      updateLayer(name);
    }
    if (context) {
      const target = Number(masterSlider.value) / 100;
      masterGain.gain.setTargetAtTime(target, context.currentTime, .15);
    }
    saveSettings();
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  function stopAudio() {
    if (!context) return;
    window.clearTimeout(crackleTimer);
    window.clearTimeout(stopTimeout);
    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(0, now, .35);
    stopTimeout = window.setTimeout(() => {
      context?.suspend().catch(() => {});
      consoleCard.classList.remove('is-playing');
      toggle.setAttribute('aria-pressed', 'false');
      document.querySelector('#sound-toggle-icon').textContent = '▶';
      document.querySelector('#sound-toggle-label').textContent = 'Включить звуки';
      status.innerHTML = '<i></i> ПАУЗА';
      stopTimeout = undefined;
    }, 1200);
  }

  function updateTimer() {
    if (!sleepDeadline) { timerLabel.textContent = 'Звуки отключены'; return; }
    const seconds = Math.max(0, Math.ceil((sleepDeadline - Date.now()) / 1000));
    if (!seconds) {
      sleepDeadline = 0;
      timerSelect.value = '0';
      stopAudio();
      timerLabel.textContent = 'Таймер завершён';
      saveSettings();
      window.clearInterval(timerId);
      timerId = undefined;
      return;
    }
    timerLabel.textContent = `До тишины ${formatTime(seconds)}`;
  }

  async function startAudio() {
    try {
      window.clearTimeout(stopTimeout);
      ensureAudio();
      await context.resume();
      masterGain.gain.cancelScheduledValues(context.currentTime);
      masterGain.gain.setTargetAtTime(Number(masterSlider.value) / 100, context.currentTime, .2);
      for (const name of layerNames) updateLayer(name, true);
      const minutes = Number(timerSelect.value);
      sleepDeadline = minutes ? Date.now() + minutes * 60_000 : 0;
      if (timerId) window.clearInterval(timerId);
      timerId = window.setInterval(updateTimer, 1000);
      updateTimer();
      consoleCard.classList.add('is-playing');
      window.clearTimeout(crackleTimer);
      scheduleCrackle();
      toggle.setAttribute('aria-pressed', 'true');
      document.querySelector('#sound-toggle-icon').textContent = 'Ⅱ';
      document.querySelector('#sound-toggle-label').textContent = 'Сделать паузу';
      status.innerHTML = '<i></i> ЗВУЧИТ';
      saveSettings();
    } catch (error) {
      status.innerHTML = '<i></i> НЕ УДАЛОСЬ ЗАПУСТИТЬ';
      timerLabel.textContent = error.message || 'Проверь поддержку аудио в браузере.';
    }
  }

  for (const slider of Object.values(sliders)) slider.addEventListener('input', renderLevels);
  masterSlider.addEventListener('input', renderLevels);
  timerSelect.value = String([0, 15, 30, 60].includes(Number(saved.timer)) ? Number(saved.timer) : 0);
  timerSelect.addEventListener('change', () => { saveSettings(); if (toggle.getAttribute('aria-pressed') === 'true') startAudio(); });
  toggle.addEventListener('click', () => toggle.getAttribute('aria-pressed') === 'true' ? stopAudio() : startAudio());

  const presets = {
    rain: { rain: 62, wind: 28, fire: 0 },
    cabin: { rain: 24, wind: 0, fire: 57 },
    wind: { rain: 18, wind: 58, fire: 10 }
  };
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-preset]').forEach(item => item.classList.toggle('active', item === button));
    for (const [name, value] of Object.entries(presets[button.dataset.preset])) sliders[name].value = String(value);
    renderLevels();
  }));
  renderLevels();
})();
