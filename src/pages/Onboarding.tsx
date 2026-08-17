import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Beef, Target, Zap, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAppStore } from '../store/useAppStore'
import type { UserProfile, ActivityLevel } from '../types'
import { toDateString } from '../utils/weekKey'

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary (desk job, no exercise)', multiplier: 1.2 },
  { value: 'light', label: 'Lightly active (1–3 days/week)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately active (3–5 days/week)', multiplier: 1.55 },
  { value: 'active', label: 'Very active (6–7 days/week)', multiplier: 1.725 },
  { value: 'very_active', label: 'Athlete (2× daily training)', multiplier: 1.9 },
]

const PROTEIN_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.4,
  light: 1.6,
  moderate: 1.8,
  active: 2.0,
  very_active: 2.2,
}

function calcGoals(weightKg: number, activityLevel: ActivityLevel): { protein: number; calories: number } {
  // Mifflin-St Jeor (approximated for male, conservative estimate)
  const bmr = 10 * weightKg + 500 // simplified
  const act = ACTIVITY_LEVELS.find((a) => a.value === activityLevel)?.multiplier ?? 1.55
  const calories = Math.round(bmr * act)
  const protein = Math.round(weightKg * (PROTEIN_MULTIPLIERS[activityLevel] ?? 1.8))
  return { protein, calories }
}

export function Onboarding() {
  const navigate = useNavigate()
  const { saveProfile } = useAppStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [proteinGoal, setProteinGoal] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const weightNum = parseFloat(weight)
  const suggested = !isNaN(weightNum) && weightNum > 0 ? calcGoals(weightNum, activity) : null

  function applySuggested() {
    if (suggested) {
      setProteinGoal(String(suggested.protein))
      setCalorieGoal(String(suggested.calories))
    }
  }

  async function finish() {
    setSaving(true)
    const profile: UserProfile = {
      id: 'profile',
      name: name.trim() || undefined,
      weightKg: weightNum || undefined,
      activityLevel: activity,
      proteinGoalG: parseInt(proteinGoal) || 120,
      calorieGoalKcal: parseInt(calorieGoal) || 2000,
      geminiApiKey: apiKey.trim() || undefined,
      onboardingComplete: true,
      createdAt: toDateString(),
    }
    await saveProfile(profile)
    setSaving(false)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-protein)] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/30">
            <Beef size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MessTrack</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Your mess meal protein tracker</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-[var(--color-protein)] w-8' : 'bg-[var(--color-surface-3)] w-4'}`}
            />
          ))}
        </div>

        {/* Step 1: About you */}
        {step === 1 && (
          <Card className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-[var(--color-protein)]" />
              <h2 className="font-semibold text-white">About you</h2>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-protein)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Body weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 70"
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-protein)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Activity level</label>
              <div className="space-y-1.5">
                {ACTIVITY_LEVELS.map((al) => (
                  <button
                    key={al.value}
                    type="button"
                    onClick={() => setActivity(al.value)}
                    className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors ${activity === al.value ? 'bg-[var(--color-protein)]/20 text-[var(--color-protein)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}
                  >
                    {al.label}
                  </button>
                ))}
              </div>
            </div>
            <Button fullWidth onClick={() => setStep(2)}>
              Next <ChevronRight size={16} />
            </Button>
          </Card>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <Card className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-[var(--color-accent-orange)]" />
              <h2 className="font-semibold text-white">Set your goals</h2>
            </div>

            {suggested && (
              <button
                type="button"
                onClick={applySuggested}
                className="w-full text-left bg-[var(--color-protein)]/10 border border-[var(--color-protein)]/30 rounded-[var(--radius-md)] px-3 py-2.5"
              >
                <p className="text-xs text-[var(--color-protein)] font-medium">Suggested for you</p>
                <p className="text-sm text-white mt-0.5">
                  {suggested.protein}g protein · {suggested.calories} kcal
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                  Based on {weightNum}kg body weight · Tap to apply
                </p>
              </button>
            )}

            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Daily protein goal (g)</label>
              <input
                type="number"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                placeholder={suggested ? String(suggested.protein) : '120'}
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-protein)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Daily calorie goal (kcal)</label>
              <input
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                placeholder={suggested ? String(suggested.calories) : '2000'}
                className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-calories)]"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!proteinGoal && !suggested}
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: API Key */}
        {step === 3 && (
          <Card className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Beef size={18} className="text-[var(--color-carbs)]" />
              <h2 className="font-semibold text-white">Gemini API key</h2>
              <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">Optional</span>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Used for AI-powered menu parsing and nutrition estimates.
              The key is stored only in your browser — never sent anywhere except the Gemini API.
            </p>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-carbs)] underline"
            >
              Get a free Gemini API key →
            </a>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-[var(--color-surface-2)] text-white rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-carbs)]"
            />

            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              You can skip this and add it later in Settings. The app works without AI — menu parsing and nutrition estimates will fall back to manual entry.
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={finish} loading={saving} className="flex-1">
                Get started
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
