import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { FloatingHeader } from '../components/ui/floating-header'
import {
  Upload, FileText, Briefcase, Clock, Zap, CheckCircle2,
  XCircle, Target, TrendingUp, BookOpen, ChevronDown, ChevronUp,
  AlertCircle, Loader2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── small helpers ────────────────────────────────────────────────────────────
const ScoreRing = ({ value, label, color }) => {
  const r = 28, cx = 36, cy = 36
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
          className="text-gray-200 dark:text-zinc-700" strokeWidth="6" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
          className={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" />
      </svg>
      <span className="text-xl font-bold text-gray-900 dark:text-white -mt-10">{value}%</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-7 text-center leading-tight">{label}</span>
    </div>
  )
}

const SkillBadge = ({ skill, variant = 'matched' }) => {
  const styles = {
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    missing: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {skill}
    </span>
  )
}

const PhaseCard = ({ phase, index }) => {
  const [open, setOpen] = useState(index === 0)
  const isImmediate = phase.phase === 'Immediate Gaps'
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
            ${isImmediate
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}`}>
            {index + 1}
          </span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{phase.phase}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{phase.timeline} · {phase.estimated_hours}h</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {phase.skills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── main page ────────────────────────────────────────────────────────────────
const SkillGapAnalyzer = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const handleFile = (f) => {
    if (!f) return
    const ok = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'].includes(f.type) ||
      f.name.match(/\.(pdf|docx|txt)$/i)
    if (!ok) { setError('Only PDF, DOCX or TXT files are supported.'); return }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload your resume.'); return }
    if (!jdText.trim()) { setError('Please paste a job description.'); return }

    setLoading(true); setError(''); setResult(null)
    try {
      const token = await auth.currentUser.getIdToken()
      const form = new FormData()
      form.append('resume_file', file)
      form.append('jd_text', jdText)
      form.append('hours_per_week', hoursPerWeek)

      const { data } = await axios.post(`${API_URL}/api/v1/analyze-gap`, form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-black dark:via-zinc-900 dark:to-black">
      <FloatingHeader onLogout={handleLogout} userName={auth.currentUser?.displayName} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Gap Analyzer</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
            Upload your resume, paste a job description and get a personalised learning roadmap.
          </p>
        </motion.div>

        {/* ── Input card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-6">

            {/* Resume upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4" /> Resume
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-input').click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors
                  ${dragOver
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/10'
                    : file
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-gray-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500'
                  }`}
              >
                <input id="resume-input" type="file" accept=".pdf,.docx,.txt" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{file.name}</span>
                    <button onClick={e => { e.stopPropagation(); setFile(null) }}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-violet-600 dark:text-violet-400">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX or TXT</p>
                  </>
                )}
              </div>
            </div>

            {/* JD textarea */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Briefcase className="w-4 h-4" /> Job Description
              </label>
              <textarea
                rows={7}
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here…"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 transition"
              />
            </div>

            {/* Hours per week */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4" /> Available study hours / week
                <span className="ml-auto text-violet-600 dark:text-violet-400 font-bold">{hoursPerWeek}h</span>
              </label>
              <input type="range" min={1} max={40} value={hoursPerWeek}
                onChange={e => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-violet-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1h</span><span>40h</span></div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                : <><Zap className="w-4 h-4" /> Analyse Skill Gap</>
              }
            </button>
          </div>
        </motion.div>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Score summary */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" /> Match Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <ScoreRing value={Math.round(result.match_percentage)} label="Skill Match" color="text-violet-500" />
                  <ScoreRing value={Math.round(result.job_readiness_score)} label="Job Readiness" color="text-blue-500" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.matched_skills.length}</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Matched Skills</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.missing_skills.length}</span>
                    <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">Gaps Found</span>
                  </div>
                </div>
              </div>

              {/* Skills side-by-side */}
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Matched */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> You Already Have
                  </h3>
                  {result.matched_skills.length === 0
                    ? <p className="text-xs text-gray-400">No matching skills detected.</p>
                    : <div className="flex flex-wrap gap-2">
                        {result.matched_skills.map(s => <SkillBadge key={s} skill={s} variant="matched" />)}
                      </div>
                  }
                </div>
                {/* Missing */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" /> Skills to Learn
                  </h3>
                  {result.missing_skills.length === 0
                    ? <p className="text-xs text-gray-400">🎉 No gaps found — you're a great match!</p>
                    : <div className="flex flex-wrap gap-2">
                        {result.missing_skills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)}
                      </div>
                  }
                </div>
              </div>

              {/* Learning velocity */}
              {result.learning_velocity && result.learning_velocity.roadmap.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" /> Learning Roadmap
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.learning_velocity.total_estimated_hours}h total
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        ~{result.learning_velocity.weeks_to_readiness} weeks at {hoursPerWeek}h/wk
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.learning_velocity.roadmap.map((phase, i) => (
                      <PhaseCard key={phase.phase} phase={phase} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default SkillGapAnalyzer
