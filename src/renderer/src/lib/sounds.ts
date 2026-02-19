import { useAppStore } from '@/store'

let audioCtx: AudioContext | null = null
let lastPopupTime = 0

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function isMuted(): boolean {
  return !useAppStore.getState().soundEnabled
}

/** Slight pitch variation (±5%) to avoid mechanical feel */
function vary(base: number): number {
  return base * (0.95 + Math.random() * 0.1)
}

/** Soft tick — button clicks, UI interactions. Very quiet. */
export function playClick(): void {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = vary(1100)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.025)
  } catch { /* ignore audio errors */ }
}

/** Gentle pop — context menus, popups. Deduplicated (100ms cooldown). */
export function playPopup(): void {
  if (isMuted()) return
  const now = Date.now()
  if (now - lastPopupTime < 100) return // Prevent duplicates
  lastPopupTime = now
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(vary(550), ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(vary(380), ctx.currentTime + 0.07)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.07)
  } catch { /* ignore */ }
}

/** Two ascending tones — task completed, success */
export function playSuccess(): void {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const base = vary(500)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.frequency.value = base
    osc1.type = 'sine'
    gain1.gain.setValueAtTime(0.05, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.07)
    // Second tone (higher)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.frequency.value = base * 1.4
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.06)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13)
    osc2.start(ctx.currentTime + 0.06)
    osc2.stop(ctx.currentTime + 0.13)
  } catch { /* ignore */ }
}

/** Descending tone — delete, remove */
export function playDelete(): void {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(vary(400), ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(vary(200), ctx.currentTime + 0.08)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  } catch { /* ignore */ }
}

/** Soft thud — card drop, drag end */
export function playDrop(): void {
  if (isMuted()) return
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = vary(150)
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  } catch { /* ignore */ }
}
