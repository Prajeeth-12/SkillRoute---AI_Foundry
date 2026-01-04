import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import RoadmapView from '../components/RoadmapView'
import { FloatingHeader } from '../components/ui/floating-header'
import axios from 'axios'

const Dashboard = () => {
  const [profile, setProfile] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    loadProfile()
    loadRoadmap()
  }, [])

  const loadProfile = async () => {
    try {
      const token = await auth.currentUser.getIdToken()
      const response = await axios.get(`${API_URL}/api/students/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data && !response.data.message) {
        setProfile(response.data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadRoadmap = async () => {
    try {
      const token = await auth.currentUser.getIdToken()
      const response = await axios.get(`${API_URL}/api/career/roadmap`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data && !response.data.message) {
        setRoadmap(response.data)
      }
    } catch (error) {
      console.error('Error loading roadmap:', error)
    }
  }

  const generateRoadmap = async () => {
    if (!profile) {
      navigate('/profile')
      return
    }
    
    setLoading(true)
    try {
      const token = await auth.currentUser.getIdToken()
      const response = await axios.post(`${API_URL}/api/career/roadmap`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRoadmap(response.data)
    } catch (error) {
      console.error('Error generating roadmap:', error)
      alert('Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <FloatingHeader 
        onLogout={handleLogout}
        userName={profile?.name}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-none dark:border dark:border-zinc-800 p-6">
          <RoadmapView 
            roadmap={roadmap}
            onGenerate={generateRoadmap}
            onRefresh={loadRoadmap}
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
