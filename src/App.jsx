import { useEffect, useMemo, useState } from 'react'
import ScenePromptBuilder from './modules/home/ScenePromptBuilder'
import StoryboardEditor from './modules/storyboard/StoryboardEditor'
import './App.css'

const HOME_PATH = '/'
const STORYBOARD_PATH = '/storyboard'

const resolvePath = (pathname) => (pathname === STORYBOARD_PATH ? STORYBOARD_PATH : HOME_PATH)

export default function App() {
  const [path, setPath] = useState(() => resolvePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setPath(resolvePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (nextPath) => {
    if (nextPath === path) return
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  const page = useMemo(() => {
    if (path === STORYBOARD_PATH) {
      return <StoryboardEditor />
    }
    return <ScenePromptBuilder />
  }, [path])

  return (
    <div className="page-root">
      <header className="top-nav">
        <div className="nav-title">Scene Prompt Builder</div>
        <div className="nav-tabs" role="tablist" aria-label="main navigation">
          <button
            className={`nav-tab ${path === HOME_PATH ? 'active' : ''}`}
            onClick={() => navigate(HOME_PATH)}
          >
            首页
          </button>
          <button
            className={`nav-tab ${path === STORYBOARD_PATH ? 'active' : ''}`}
            onClick={() => navigate(STORYBOARD_PATH)}
          >
            Storyboard Editor
          </button>
        </div>
      </header>
      {page}
    </div>
  )
}
