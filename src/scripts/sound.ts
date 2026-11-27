// Ambient drone toggle. The AudioContext is only created on the first click.
const btn = document.getElementById("snd");
const label = document.getElementById("sndt");
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;

function build() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  master.connect(filter);
  filter.connect(ctx.destination);
  [55, 82.41, 110, 164.81].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = i % 2 ? "triangle" : "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.22 / (i + 1);
    const lfo = ctx!.createOscillator();
    const lfoGain = ctx!.createGain();
    lfo.frequency.value = 0.05 + i * 0.03;
    lfoGain.gain.value = gain.gain.value * 0.6;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(master!);
    osc.start();
    lfo.start();
  });
}

btn?.addEventListener("click", () => {
  if (!ctx) {
    try {
      build();
    } catch {
      return;
    }
  }
  on = !on;
  if (ctx!.state === "suspended") ctx!.resume();
  master!.gain.cancelScheduledValues(ctx!.currentTime);
  master!.gain.linearRampToValueAtTime(on ? 0.5 : 0, ctx!.currentTime + 1.2);
  btn.classList.toggle("on", on);
  if (label) label.textContent = on ? "Sound on" : "Click to enable sound";
});
