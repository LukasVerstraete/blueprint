'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { ProjectWithRole } from '@/types/project'

interface ProjectContextType {
  currentProject: ProjectWithRole | null
  setCurrentProject: (project: ProjectWithRole | null) => void
  projects: ProjectWithRole[]
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectWithRole | null>(null)
  const { data: projects = [], isLoading } = useProjects()

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const savedProjectId = localStorage.getItem('lastActiveProjectId')
      const savedProject = projects.find(p => p.id === savedProjectId)
      
      if (savedProject) {
        setCurrentProject(savedProject)
      } else {
        setCurrentProject(projects[0])
      }
    }
  }, [projects, currentProject])

  const handleSetCurrentProject = (project: ProjectWithRole | null) => {
    setCurrentProject(project)
    if (project) {
      localStorage.setItem('lastActiveProjectId', project.id)
    } else {
      localStorage.removeItem('lastActiveProjectId')
    }
  }

  return (
    <ProjectContext.Provider 
      value={{ 
        currentProject, 
        setCurrentProject: handleSetCurrentProject, 
        projects,
        isLoading 
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}