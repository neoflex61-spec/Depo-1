(function () {
  "use strict";

  // ===================================================================
  // Setup
  // ===================================================================
  var stage = document.getElementById("stage");
  var lucien = document.getElementById("lucien");
  var morgana = document.getElementById("morgana");
  var butler = document.getElementById("butler");
  var door = document.querySelector(".door");
  var subtitleEl = document.getElementById("subtitle");
  var titlecard = document.getElementById("titlecard");
  var replayBtn = document.getElementById("replayBtn");

  var playBtn = document.getElementById("playBtn");
  var pauseBtn = document.getElementById("pauseBtn");
  var restartBtn = document.getElementById("restartBtn");
  var muteBtn = document.getElementById("muteBtn");

  var END_TIME = 11.4; // seconds; after this the sequence is considered finished

  // ===================================================================
  // Floating dust particles (ambient, generated once)
  // ===================================================================
  (function spawnParticles() {
    var container = document.getElementById("particles");
    var count = 16;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "mote";
      var left = Math.random() * 100;
      var dur = 9 + Math.random() * 10;
      var delay = Math.random() * -dur;
      var dx = (Math.random() * 60 - 30).toFixed(1) + "px";
      var size = (2 + Math.random() * 2.5).toFixed(1) + "px";
      p.style.left = left + "%";
      p.style.width = size;
      p.style.height = size;
      p.style.animationDuration = dur.toFixed(2) + "s";
      p.style.animationDelay = delay.toFixed(2) + "s";
      p.style.setProperty("--dx", dx);
      container.appendChild(p);
    }
  })();

  // ===================================================================
  // Minimal generative audio (no files, created only after a user gesture)
  // ===================================================================
  var audioCtx = null;
  var masterGain = null;
  var isMuted = false;
  var VOLUME = 0.55;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return; // no Web Audio support: animation still works, just silent
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0 : VOLUME;
    masterGain.connect(audioCtx.destination);
    startDrone();
    startWind();
  }

  function startDrone() {
    var osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 68;
    var g = audioCtx.createGain();
    g.gain.value = 0.16;
    var lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.12;
    var lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    lfo.start();
  }

  function startWind() {
    var bufferSize = audioCtx.sampleRate * 2;
    var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    var noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    var filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    var g = audioCtx.createGain();
    g.gain.value = 0.06;
    noise.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    noise.start();
  }

  function sfx(name) {
    if (!audioCtx || !masterGain) return;
    var t0 = audioCtx.currentTime;
    if (name === "creak") {
      var bufferSize = audioCtx.sampleRate * 0.55;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      var filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 750;
      var ng = audioCtx.createGain();
      ng.gain.value = 0.32;
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(masterGain);
      noise.start(t0);
      noise.stop(t0 + 0.55);
      return;
    }
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.connect(g);
    g.connect(masterGain);
    if (name === "thud") {
      o.type = "sine";
      o.frequency.setValueAtTime(90, t0);
      o.frequency.exponentialRampToValueAtTime(40, t0 + 0.25);
      g.gain.setValueAtTime(0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      o.start(t0);
      o.stop(t0 + 0.3);
    } else if (name === "chime") {
      o.type = "sine";
      o.frequency.setValueAtTime(660, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
      o.start(t0);
      o.stop(t0 + 1.2);
    } else if (name === "stinger") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, t0);
      o.frequency.exponentialRampToValueAtTime(140, t0 + 0.4);
      g.gain.setValueAtTime(0.18, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.start(t0);
      o.stop(t0 + 0.5);
    } else if (name === "bell") {
      o.type = "sine";
      o.frequency.setValueAtTime(220, t0);
      g.gain.setValueAtTime(0.28, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4);
      o.start(t0);
      o.stop(t0 + 2.4);
    }
  }

  // ===================================================================
  // Subtitle helpers
  // ===================================================================
  function showSubtitle(text) {
    subtitleEl.textContent = text;
    subtitleEl.classList.add("show");
  }
  function hideSubtitle() {
    subtitleEl.classList.remove("show");
  }

  // ===================================================================
  // Reset all character/scene state to the very start
  // ===================================================================
  function resetState() {
    lucien.setAttribute("class", "character expr-neutral");
    morgana.setAttribute("class", "character expr-neutral");
    butler.setAttribute("class", "character offstage expr-neutral");
    door.classList.remove("door-shake");
    hideSubtitle();
    titlecard.classList.remove("show");
    replayBtn.classList.add("hidden");
    stage.classList.remove("paused", "ended");
  }

  // ===================================================================
  // Timeline: each entry fires once, in order, as elapsed time passes it
  // ===================================================================
  var TIMELINE = [
    {
      t: 0.0,
      run: function () {
        lucien.classList.add("pose-present");
        sfx("thud");
      }
    },
    {
      t: 3.0,
      run: function () {
        lucien.classList.add("is-talking", "expr-loving");
        showSubtitle("Morgana, kalbim sonsuza kadar senin.");
        sfx("chime");
      }
    },
    {
      t: 6.0,
      run: function () {
        lucien.classList.remove("is-talking");
        lucien.classList.add("expr-shocked");
        morgana.classList.add("is-talking", "expr-smug", "pose-sassy");
        showSubtitle("Harika. Viktor'un düğününde de yanında getir.");
        sfx("stinger");
      }
    },
    {
      t: 7.6,
      run: function () {
        door.classList.add("door-shake");
      }
    },
    {
      t: 8.0,
      run: function () {
        morgana.classList.remove("is-talking");
        butler.classList.remove("offstage");
        butler.classList.add("onstage", "is-talking");
        showSubtitle("Kalbinizi tabuta mı koyalım efendim?");
        sfx("creak");
      }
    },
    {
      t: 10.0,
      run: function () {
        butler.classList.remove("is-talking");
        hideSubtitle();
        titlecard.classList.add("show");
        sfx("bell");
      }
    },
    {
      t: 11.0,
      run: function () {
        replayBtn.classList.remove("hidden");
      }
    }
  ];

  // ===================================================================
  // Playback clock
  // ===================================================================
  var elapsed = 0;          // seconds of timeline progress
  var running = false;      // rAF loop active?
  var started = false;      // has play() ever been called this cycle?
  var lastTick = null;      // performance.now() of previous frame
  var nextEventIndex = 0;   // index into TIMELINE of the next event to fire
  var rafId = null;

  function tick(now) {
    if (lastTick === null) lastTick = now;
    var dt = (now - lastTick) / 1000;
    lastTick = now;
    elapsed += dt;

    while (nextEventIndex < TIMELINE.length && TIMELINE[nextEventIndex].t <= elapsed) {
      TIMELINE[nextEventIndex].run();
      nextEventIndex++;
    }

    if (elapsed >= END_TIME) {
      running = false;
      stage.classList.add("ended");
      updateButtons();
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  function play() {
    ensureAudio();
    if (running) return;
    if (elapsed >= END_TIME) {
      // sequence had finished: replay from the start
      doRestart();
    }
    running = true;
    started = true;
    lastTick = null;
    stage.classList.remove("paused");
    rafId = requestAnimationFrame(tick);
    updateButtons();
  }

  function pause() {
    if (!running) return;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    stage.classList.add("paused");
    if (audioCtx && audioCtx.state === "running") audioCtx.suspend();
    updateButtons();
  }

  function doRestart() {
    if (rafId) cancelAnimationFrame(rafId);
    running = false;
    started = false;
    elapsed = 0;
    lastTick = null;
    nextEventIndex = 0;
    resetState();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function restart() {
    doRestart();
    play();
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain) masterGain.gain.value = isMuted ? 0 : VOLUME;
    muteBtn.setAttribute("aria-pressed", isMuted ? "true" : "false");
    muteBtn.querySelector("span").textContent = isMuted ? "Sessiz" : "Ses";
    muteBtn.firstChild.textContent = isMuted ? "🔇" : "🔊";
  }

  function updateButtons() {
    playBtn.disabled = running;
    pauseBtn.disabled = !running;
  }

  // ===================================================================
  // Wire up controls
  // ===================================================================
  playBtn.addEventListener("click", play);
  pauseBtn.addEventListener("click", pause);
  restartBtn.addEventListener("click", restart);
  muteBtn.addEventListener("click", toggleMute);
  replayBtn.addEventListener("click", restart);

  // initial state: nothing has played yet
  resetState();
  updateButtons();
})();
