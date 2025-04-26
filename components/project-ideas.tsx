"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MoreHorizontal, Clock, Loader2, LightbulbIcon, ClipboardList } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getProjectStats,
  type Project,
  type ProjectFormData,
  type ProjectsQueryOptions,
} from "@/lib/services/project-service"

const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile App",
  "Data Science",
  "Machine Learning",
  "UI/UX",
  "Game Dev",
  "Automation",
  "IoT",
  "Other"
]

export function ProjectIdeas() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({ total: 0, ideas: 0, inProgress: 0, completed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [category, setCategory] = useState("")
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<"idea" | "planning" | "in-progress" | "completed" | "archived">("idea")
  const [tag, setTag] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  // Fetch projects and stats
  useEffect(() => {
    if (!authLoading && user) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          // Fetch all projects and stats
          const [fetchedProjects, fetchedStats] = await Promise.all([
            getProjects(user.uid),
            getProjectStats(user.uid)
          ])
          
          setProjects(fetchedProjects)
          setStats(fetchedStats)
          
          // Initial filter
          filterProjects(fetchedProjects, activeTab, searchQuery)
        } catch (error) {
          console.error("Error fetching projects or stats:", error)
          toast({
            title: "Error",
            description: "Failed to load projects. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchData()
    } else if (!authLoading && !user) {
      setProjects([])
      setFilteredProjects([])
      setStats({ total: 0, ideas: 0, inProgress: 0, completed: 0 })
      setIsLoading(false)
    }
  }, [user, authLoading, toast])

  // Filter projects when tab or search changes
  useEffect(() => {
    filterProjects(projects, activeTab, searchQuery)
  }, [activeTab, searchQuery, projects])

  // Filter projects based on tab and search
  const filterProjects = (allProjects: Project[], tab: string, query: string) => {
    let filtered = [...allProjects]
    
    // Filter by tab
    if (tab !== "all") {
      if (tab === "ideas") {
        filtered = filtered.filter(project => project.status === "idea")
      } else if (tab === "in-progress") {
        filtered = filtered.filter(project => ["planning", "in-progress"].includes(project.status))
      } else if (tab === "completed") {
        filtered = filtered.filter(project => project.status === "completed")
      }
    }
    
    // Filter by search query
    if (query) {
      const lowercaseQuery = query.toLowerCase()
      filtered = filtered.filter(
        project => 
          project.title.toLowerCase().includes(lowercaseQuery) || 
          (project.description && project.description.toLowerCase().includes(lowercaseQuery)) ||
          (project.category && project.category.toLowerCase().includes(lowercaseQuery)) ||
          project.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
    }
    
    setFilteredProjects(filtered)
  }

  const refreshData = async () => {
    if (!user) return
    
    try {
      // Fetch all projects and stats
      const [fetchedProjects, fetchedStats] = await Promise.all([
        getProjects(user.uid),
        getProjectStats(user.uid)
      ])
      
      setProjects(fetchedProjects)
      setStats(fetchedStats)
      
      // Update filtered projects
      filterProjects(fetchedProjects, activeTab, searchQuery)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  const openAddDialog = () => {
    setProjectToEdit(null)
    setTitle("")
    setDescription("")
    setDifficulty("medium")
    setCategory("")
    setEstimatedHours(undefined)
    setStatus("idea")
    setTags([])
    setDialogOpen(true)
  }

  const openEditDialog = (project: Project) => {
    setProjectToEdit(project)
    setTitle(project.title)
    setDescription(project.description || "")
    setDifficulty(project.difficulty)
    setCategory(project.category || "")
    setEstimatedHours(project.estimatedHours)
    setStatus(project.status)
    setTags(project.tags || [])
    setDialogOpen(true)
  }

  const handleSaveProject = async () => {
    if (!title.trim() || !user) {
      toast({
        title: "Error",
        description: "Project title is required",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      const projectData: ProjectFormData = {
        title,
        description: description || undefined,
        difficulty,
        status,
        estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : undefined,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
      }
      
      let savedProject: Project
      
      if (projectToEdit) {
        // Update existing project
        savedProject = await updateProject(projectToEdit.id, projectData, user.uid)
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        })
      } else {
        // Create new project
        savedProject = await createProject(projectData, user.uid)
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        })
      }
      
      await refreshData()
      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return
    
    try {
      await deleteProject(projectId, user.uid)
      await refreshData()
      
      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (projectId: string, newStatus: "idea" | "planning" | "in-progress" | "completed" | "archived") => {
    if (!user) return
    
    try {
      await updateProjectStatus(projectId, newStatus, user.uid)
      await refreshData()
      
      toast({
        title: "Status updated",
        description: "Project status has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating project status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()])
      setTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }
  
  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-foreground/10 text-foreground/70"
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "idea":
        return "bg-blue-100 text-blue-800"
      case "planning":
        return "bg-purple-100 text-purple-800"
      case "in-progress":
        return "bg-amber-100 text-amber-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-foreground/10 text-foreground/70"
    }
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-foreground/10 text-foreground/70"
    
    const hash = Array.from(category).reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const hue = Math.abs(hash) % 360
    return `bg-[hsl(${hue},80%,92%)] text-[hsl(${hue},80%,25%)]`
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>Project Ideas</CardTitle>
            {!isLoading && (
              <div className="text-sm text-foreground/60 mt-1">
                {stats.total} projects ({stats.ideas} ideas, {stats.inProgress} in progress, {stats.completed} completed)
              </div>
            )}
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" /> Add Project
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-2 mb-4 flex-col sm:flex-row">
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-2">
                <ProjectList 
                  projects={filteredProjects}
                  isLoading={isLoading}
                  isEmpty={projects.length === 0}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteProject}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNew={openAddDialog}
                  getDifficultyColor={getDifficultyColor}
                  getStatusColor={getStatusColor}
                  getCategoryColor={getCategoryColor}
                  user={user}
                />
              </TabsContent>
              
              <TabsContent value="ideas" className="mt-2">
                <ProjectList 
                  projects={filteredProjects}
                  isLoading={isLoading}
                  isEmpty={projects.filter(p => p.status === 'idea').length === 0}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteProject}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNew={openAddDialog}
                  getDifficultyColor={getDifficultyColor}
                  getStatusColor={getStatusColor}
                  getCategoryColor={getCategoryColor}
                  user={user}
                />
              </TabsContent>
              
              <TabsContent value="in-progress" className="mt-2">
                <ProjectList 
                  projects={filteredProjects}
                  isLoading={isLoading}
                  isEmpty={projects.filter(p => ['planning', 'in-progress'].includes(p.status)).length === 0}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteProject}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNew={openAddDialog}
                  getDifficultyColor={getDifficultyColor}
                  getStatusColor={getStatusColor}
                  getCategoryColor={getCategoryColor}
                  user={user}
                />
              </TabsContent>
              
              <TabsContent value="completed" className="mt-2">
                <ProjectList 
                  projects={filteredProjects}
                  isLoading={isLoading}
                  isEmpty={projects.filter(p => p.status === 'completed').length === 0}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteProject}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNew={openAddDialog}
                  getDifficultyColor={getDifficultyColor}
                  getStatusColor={getStatusColor} 
                  getCategoryColor={getCategoryColor}
                  user={user}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {/* Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{projectToEdit ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {projectToEdit 
                ? "Make changes to your project idea." 
                : "Add a new project idea to your collection."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project idea"
                className="resize-none min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={status} 
                  onValueChange={(value: "idea" | "planning" | "in-progress" | "completed" | "archived") => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Est. Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min={0}
                  value={estimatedHours || ''}
                  onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((t) => (
                    <Badge key={t} variant="secondary" className="flex items-center gap-1">
                      {t}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTag(t)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="sr-only">Remove {t} tag</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {projectToEdit ? "Saving..." : "Creating..."}
                </>
              ) : projectToEdit ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
  isEmpty: boolean
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onUpdateStatus: (projectId: string, status: "idea" | "planning" | "in-progress" | "completed" | "archived") => void
  onAddNew: () => void
  getDifficultyColor: (difficulty: "easy" | "medium" | "hard") => string
  getStatusColor: (status: string) => string
  getCategoryColor: (category?: string) => string
  user: any
}

function ProjectList({ 
  projects, 
  isLoading, 
  isEmpty,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddNew,
  getDifficultyColor,
  getStatusColor,
  getCategoryColor,
  user 
}: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/40" />
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground/60 mb-4">Please log in to manage your projects.</p>
      </div>
    )
  }
  
  if (isEmpty) {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <LightbulbIcon className="h-12 w-12 text-primary/30" />
        </div>
        <p className="text-foreground/60 mb-4">You don't have any projects yet.</p>
        <Button onClick={onAddNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Your First Project
        </Button>
      </div>
    )
  }
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground/60 mb-4">No matching projects found.</p>
        <Button onClick={onAddNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add New Project
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(
            "rounded-lg border p-4 transition-colors hover:bg-accent/50",
            project.status === "completed" ? "bg-accent/20 border-accent/20" : "bg-white"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-md font-medium">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{project.description}</p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(project)}>Edit</DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem disabled={project.status === "idea"} onClick={() => onUpdateStatus(project.id, "idea")}>
                  Mark as Idea
                </DropdownMenuItem>
                <DropdownMenuItem disabled={project.status === "planning"} onClick={() => onUpdateStatus(project.id, "planning")}>
                  Mark as Planning
                </DropdownMenuItem>
                <DropdownMenuItem disabled={project.status === "in-progress"} onClick={() => onUpdateStatus(project.id, "in-progress")}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem disabled={project.status === "completed"} onClick={() => onUpdateStatus(project.id, "completed")}>
                  Mark as Completed
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center mt-3">
            <Badge className={cn("text-xs", getStatusColor(project.status))}>
              {project.status.replace('-', ' ')}
            </Badge>
            
            <Badge className={cn("text-xs", getDifficultyColor(project.difficulty))}>
              {project.difficulty}
            </Badge>
            
            {project.category && (
              <Badge className={cn("text-xs", getCategoryColor(project.category))}>
                {project.category}
              </Badge>
            )}
            
            {project.estimatedHours !== undefined && (
              <div className="text-xs flex items-center text-foreground/60">
                <Clock className="h-3 w-3 mr-1" />
                {project.estimatedHours} hours
              </div>
            )}
          </div>
          
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {project.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs py-0 px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}