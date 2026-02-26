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
  AlertCircle, Loader2, ExternalLink, Play, BookMarked, Code2 as CodeIcon,
  Box, Layers, Cloud, Brain, Cpu, Gamepad2, Monitor, Server,
  BarChart2, Smartphone, GitBranch, Map, ArrowRight
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Role & Tool presets ───────────────────────────────────────────────────────
const ROLES = [
  { title: 'Game Developer',     icon: Gamepad2,  color: 'violet', jdKey: 'game developer' },
  { title: 'Frontend Developer', icon: Monitor,   color: 'blue',   jdKey: 'frontend developer' },
  { title: 'Backend Developer',  icon: Server,    color: 'green',  jdKey: 'backend developer' },
  { title: 'Data Scientist',     icon: BarChart2, color: 'orange', jdKey: 'data scientist' },
  { title: 'DevOps Engineer',    icon: GitBranch, color: 'red',    jdKey: 'devops' },
  { title: 'Mobile Developer',   icon: Smartphone,color: 'pink',   jdKey: 'mobile developer' },
]

const TOOLS = [
  { title: 'React',            icon: CodeIcon, color: 'blue',   jdKey: 'react developer' },
  { title: 'Docker',           icon: Box,      color: 'sky',    jdKey: 'docker engineer' },
  { title: 'Python',           icon: Cpu,      color: 'yellow', jdKey: 'python developer' },
  { title: 'Kubernetes',       icon: Layers,   color: 'indigo', jdKey: 'kubernetes engineer' },
  { title: 'AWS',              icon: Cloud,    color: 'orange', jdKey: 'aws engineer' },
  { title: 'Machine Learning', icon: Brain,    color: 'purple', jdKey: 'machine learning engineer' },
]

const COLOR_MAP = {
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-300 dark:border-violet-700',
  blue:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400   border-blue-300   dark:border-blue-700',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  red:    'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400    border-red-300    dark:border-red-700',
  pink:   'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400   border-pink-300   dark:border-pink-700',
  sky:    'bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-400    border-sky-300    dark:border-sky-700',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700',
}

// ── Resource type icons / colours ────────────────────────────────────────────
const RESOURCE_META = {
  docs:    { label: 'Docs',    icon: BookMarked, color: 'text-blue-500'   },
  course:  { label: 'Course',  icon: BookOpen,   color: 'text-violet-500' },
  video:   { label: 'Video',   icon: Play,       color: 'text-red-500'    },
  article: { label: 'Article', icon: FileText,   color: 'text-emerald-500'},
  project: { label: 'Project', icon: CodeIcon,   color: 'text-orange-500' },
}

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
  const [expandedSkill, setExpandedSkill] = useState(null)
  const isImmediate = phase.phase === 'Immediate Gaps'
  const skillDetails = phase.skill_details || []

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      {/* Phase header */}
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />{phase.timeline}
              </span>
              <span className="text-gray-300 dark:text-zinc-600">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{phase.estimated_hours}h total</span>
              <span className="text-gray-300 dark:text-zinc-600">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{phase.skills.length} skills</span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
              {skillDetails.length > 0 ? (
                skillDetails.map((sd, si) => {
                  const isExpanded = expandedSkill === si
                  return (
                    <div key={sd.name} className="rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                      {/* Skill row */}
                      <button
                        onClick={() => setExpandedSkill(isExpanded ? null : si)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{sd.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 uppercase font-medium">{sd.category}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">~{sd.hours}h</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">{sd.resources?.length || 0} resources</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                      </button>

                      {/* Resources list */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 py-2 space-y-2">
                              {(sd.resources || []).map((res, ri) => {
                                const meta = RESOURCE_META[res.type] || RESOURCE_META.article
                                const Icon = meta.icon
                                return (
                                  <a
                                    key={ri}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between gap-3 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                  >
                                    <div className="flex items-start gap-2 min-w-0">
                                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${meta.color}`} />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                                          {res.title}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                          <span className="capitalize">{meta.label}</span>
                                          {res.duration && res.duration !== 'varies' && (
                                            <><span>·</span><Clock className="w-2.5 h-2.5" />{res.duration}</>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-gray-300 dark:text-zinc-600 group-hover:text-violet-500 transition-colors shrink-0 mt-0.5" />
                                  </a>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              ) : (
                /* Fallback: just show badges if no skill_details (old response) */
                <div className="flex flex-wrap gap-2">
                  {phase.skills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Preset card (role or tool) ───────────────────────────────────────────────
const PresetCard = ({ item, selected, onSelect }) => {
  const Icon = item.icon
  const colorClass = COLOR_MAP[item.color] || COLOR_MAP.blue
  const isSelected = selected === item.jdKey
  return (
    <button
      onClick={() => onSelect(item.jdKey)}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
        ${isSelected
          ? `${colorClass} shadow-md scale-[1.03]`
          : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm'
        }`}
    >
      {isSelected && (
        <span className="absolute top-2 right-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-current opacity-80" />
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center
        ${isSelected ? 'bg-white/40 dark:bg-black/20' : 'bg-gray-100 dark:bg-zinc-800'}`}>
        <Icon className={`w-5 h-5 ${isSelected ? 'text-current' : 'text-gray-500 dark:text-gray-400'}`} />
      </div>
      <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-current' : 'text-gray-700 dark:text-gray-300'}`}>
        {item.title}
      </span>
    </button>
  )
}

// ── main page ────────────────────────────────────────────────────────────────
const SkillGapAnalyzer = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [jdMode, setJdMode] = useState('custom')   // 'custom' | 'role' | 'tool'
  const [jdText, setJdText] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [adoptLoading, setAdoptLoading] = useState(false)
  const [adoptDone, setAdoptDone] = useState(false)

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

  const handlePresetSelect = (jdKey) => {
    setSelectedPreset(jdKey)
    setError('')
  }

  const handleModeSwitch = (mode) => {
    setJdMode(mode)
    if (mode === 'custom') setSelectedPreset(null)
    setError('')
  }

  const activeJdText = jdMode === 'custom' ? jdText : (selectedPreset || '')

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload your resume.'); return }
    if (!activeJdText.trim()) {
      setError(jdMode === 'custom' ? 'Please paste a job description.' : 'Please select a role or tool first.')
      return
    }

    setLoading(true); setError(''); setResult(null); setAdoptDone(false)
    try {
      const token = await auth.currentUser.getIdToken()
      const form = new FormData()
      form.append('resume_file', file)
      form.append('jd_text', activeJdText)
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

  const handleAdoptRoadmap = async () => {
    if (!result) return
    setAdoptLoading(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const title = activeJdText
        ? activeJdText.charAt(0).toUpperCase() + activeJdText.slice(1) + ' Roadmap'
        : 'Skill Gap Roadmap'
      await axios.post(`${API_URL}/api/v1/adopt-roadmap`, {
        gap_analysis: result,
        roadmap_title: title,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setAdoptDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to adopt roadmap.')
    } finally {
      setAdoptLoading(false)
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
            Upload your resume and compare against a JD, a role, or a specific tool stack.
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

            {/* ── JD / Role / Tool tabs ── */}
            <div>
              {/* Tab switcher */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 mb-4">
                {[
                  { key: 'custom', label: 'Custom JD',  Icon: FileText  },
                  { key: 'role',   label: 'By Role',    Icon: Briefcase },
                  { key: 'tool',   label: 'By Tool',    Icon: Zap       },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleModeSwitch(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all
                      ${jdMode === key
                        ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {jdMode === 'custom' && (
                  <motion.div key="custom"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}>
                    <textarea
                      rows={7}
                      value={jdText}
                      onChange={e => setJdText(e.target.value)}
                      placeholder="Paste the full job description here…"
                      className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 transition"
                    />
                  </motion.div>
                )}

                {jdMode === 'role' && (
                  <motion.div key="role"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Pick the role you're targeting — we'll infer the expected skill set automatically.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ROLES.map(r => (
                        <PresetCard key={r.jdKey} item={r} selected={selectedPreset} onSelect={handlePresetSelect} />
                      ))}
                    </div>
                    {selectedPreset && (
                      <p className="mt-3 text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected: <span className="font-bold capitalize ml-1">{selectedPreset}</span>
                      </p>
                    )}
                  </motion.div>
                )}

                {jdMode === 'tool' && (
                  <motion.div key="tool"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Pick a tool or technology — we'll check how ready your resume is for that stack.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TOOLS.map(t => (
                        <PresetCard key={t.jdKey} item={t} selected={selectedPreset} onSelect={handlePresetSelect} />
                      ))}
                    </div>
                    {selectedPreset && (
                      <p className="mt-3 text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected: <span className="font-bold capitalize ml-1">{selectedPreset}</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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

              {/* ── Set as My Roadmap CTA ── */}
              {result.learning_velocity?.roadmap?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all
                    ${adoptDone
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/10'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${adoptDone ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-violet-100 dark:bg-violet-900/30'}`}>
                      {adoptDone
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        : <Map className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${adoptDone ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                        {adoptDone ? 'Roadmap set as your main path!' : 'Make this your learning roadmap'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {adoptDone
                          ? 'Head to your Dashboard to track progress, mark milestones and access all resources.'
                          : 'Save this roadmap to your Dashboard to track progress, tick off milestones, and follow it day-by-day.'}
                      </p>
                    </div>
                  </div>
                  {adoptDone ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleAdoptRoadmap}
                      disabled={adoptLoading}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                    >
                      {adoptLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                        : <><Map className="w-4 h-4" /> Set as My Roadmap</>}
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default SkillGapAnalyzer
