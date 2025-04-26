import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"

export interface Project {
  id: string
  title: string
  description?: string
  difficulty: "easy" | "medium" | "hard"
  status: "idea" | "planning" | "in-progress" | "completed" | "archived"
  estimatedHours?: number
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ProjectFormData {
  title: string
  description?: string
  difficulty?: "easy" | "medium" | "hard"
  status?: "idea" | "planning" | "in-progress" | "completed" | "archived"
  estimatedHours?: number
  category?: string
  tags?: string[]
}

export interface ProjectsQueryOptions {
  status?: "idea" | "planning" | "in-progress" | "completed" | "archived"
  difficulty?: "easy" | "medium" | "hard"
  category?: string
  tag?: string
  limit?: number
  startAfter?: DocumentSnapshot
  orderByField?: "title" | "difficulty" | "createdAt" | "updatedAt"
  orderDirection?: "asc" | "desc"
}

export async function getProjects(userId: string, options: ProjectsQueryOptions = {}): Promise<Project[]> {
  console.log("getProjects: Starting with userId", userId, "and options:", options);
  try {
    const projectsRef = collection(db, "projects");
    console.log("getProjects: Created collection reference for 'projects'");
    
    let q = query(projectsRef, where("userId", "==", userId));
    console.log("getProjects: Applied userId filter");

    // Apply filters
    if (options.status) {
      q = query(q, where("status", "==", options.status));
      console.log("getProjects: Applied status filter:", options.status);
    }
    
    if (options.difficulty) {
      q = query(q, where("difficulty", "==", options.difficulty));
      console.log("getProjects: Applied difficulty filter:", options.difficulty);
    }
    
    if (options.category) {
      q = query(q, where("category", "==", options.category));
      console.log("getProjects: Applied category filter:", options.category);
    }
    
    if (options.tag) {
      q = query(q, where("tags", "array-contains", options.tag));
      console.log("getProjects: Applied tag filter:", options.tag);
    }

    // Apply ordering
    const orderByField = options.orderByField || "createdAt";
    const orderDirection = options.orderDirection || "desc";
    q = query(q, orderBy(orderByField, orderDirection));
    console.log(`getProjects: Applied ordering by ${orderByField} ${orderDirection}`);

    // Apply pagination
    if (options.limit) {
      q = query(q, limit(options.limit));
      console.log("getProjects: Applied limit:", options.limit);
    }
    
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
      console.log("getProjects: Applied startAfter pagination");
    }

    console.log("getProjects: Executing query...");
    const querySnapshot = await getDocs(q);
    console.log(`getProjects: Query returned ${querySnapshot.size} documents`);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(`getProjects: Processing document with ID: ${doc.id}`);
      return {
        id: doc.id,
        title: data.title || "",
        description: data.description,
        difficulty: data.difficulty,
        status: data.status,
        estimatedHours: data.estimatedHours,
        category: data.category,
        tags: data.tags || [],
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)
    
    if (!projectSnap.exists()) {
      return null
    }
    
    const data = projectSnap.data()
    // Verify that the project belongs to the user
    if (data.userId !== userId) {
      return null
    }
    
    return {
      id: projectSnap.id,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      status: data.status,
      estimatedHours: data.estimatedHours,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    }
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export async function createProject(projectData: ProjectFormData, userId: string): Promise<Project> {
  try {
    if (!userId) {
      throw new Error("User ID is required to create a project")
    }
    
    const projectsRef = collection(db, "projects")
    
    // Create the project object for Firestore
    const projectToAdd = {
      title: projectData.title,
      description: projectData.description || null,
      difficulty: projectData.difficulty || "medium",
      status: projectData.status || "idea",
      estimatedHours: projectData.estimatedHours || null,
      category: projectData.category || null,
      tags: projectData.tags || [],
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    const docRef = await addDoc(projectsRef, projectToAdd)
    const createdAt = new Date()
    
    // Return the created project object
    return {
      id: docRef.id,
      title: projectData.title,
      description: projectData.description,
      difficulty: projectData.difficulty || "medium",
      status: projectData.status || "idea",
      estimatedHours: projectData.estimatedHours,
      category: projectData.category,
      tags: projectData.tags || [],
      createdAt,
      updatedAt: createdAt,
    }
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

export async function updateProject(projectId: string, projectData: ProjectFormData, userId: string): Promise<Project> {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)
    
    if (!projectSnap.exists()) {
      throw new Error("Project not found")
    }
    
    const data = projectSnap.data()
    // Verify that the project belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }
    
    const projectToUpdate = {
      title: projectData.title,
      description: projectData.description || null,
      difficulty: projectData.difficulty || data.difficulty,
      status: projectData.status || data.status,
      estimatedHours: projectData.estimatedHours !== undefined ? projectData.estimatedHours : data.estimatedHours,
      category: projectData.category || data.category,
      tags: projectData.tags || data.tags,
      updatedAt: serverTimestamp(),
    }
    
    await updateDoc(projectRef, projectToUpdate)
    const updatedAt = new Date()
    
    return {
      id: projectId,
      title: projectData.title,
      description: projectData.description || data.description,
      difficulty: projectData.difficulty || data.difficulty,
      status: projectData.status || data.status,
      estimatedHours: projectData.estimatedHours !== undefined ? projectData.estimatedHours : data.estimatedHours,
      category: projectData.category || data.category,
      tags: projectData.tags || data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt,
    }
  } catch (error) {
    console.error("Error updating project:", error)
    throw error
  }
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)
    
    if (!projectSnap.exists()) {
      throw new Error("Project not found")
    }
    
    const data = projectSnap.data()
    // Verify that the project belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }
    
    await deleteDoc(projectRef)
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error
  }
}

export async function updateProjectStatus(
  projectId: string, 
  status: "idea" | "planning" | "in-progress" | "completed" | "archived", 
  userId: string
): Promise<Project> {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)
    
    if (!projectSnap.exists()) {
      throw new Error("Project not found")
    }
    
    const data = projectSnap.data()
    // Verify that the project belongs to the user
    if (data.userId !== userId) {
      throw new Error("Unauthorized")
    }
    
    await updateDoc(projectRef, {
      status,
      updatedAt: serverTimestamp(),
    })
    
    return {
      id: projectId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      status,
      estimatedHours: data.estimatedHours,
      category: data.category,
      tags: data.tags || [],
      createdAt: data.createdAt.toDate(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error updating project status:", error)
    throw error
  }
}

export async function getProjectStats(userId: string): Promise<{
  total: number
  ideas: number
  inProgress: number
  completed: number
}> {
  try {
    const projectsRef = collection(db, "projects")
    
    // Get total projects
    const totalQuery = query(projectsRef, where("userId", "==", userId))
    const totalSnapshot = await getDocs(totalQuery)
    const total = totalSnapshot.size
    
    // Get idea projects
    const ideasQuery = query(
      projectsRef, 
      where("userId", "==", userId), 
      where("status", "==", "idea")
    )
    const ideasSnapshot = await getDocs(ideasQuery)
    const ideas = ideasSnapshot.size
    
    // Get in-progress projects (planning or in-progress)
    const inProgressQuery = query(
      projectsRef,
      where("userId", "==", userId),
      where("status", "in", ["planning", "in-progress"])
    )
    const inProgressSnapshot = await getDocs(inProgressQuery)
    const inProgress = inProgressSnapshot.size
    
    // Get completed projects
    const completedQuery = query(
      projectsRef,
      where("userId", "==", userId),
      where("status", "==", "completed")
    )
    const completedSnapshot = await getDocs(completedQuery)
    const completed = completedSnapshot.size
    
    return {
      total,
      ideas,
      inProgress,
      completed,
    }
  } catch (error) {
    console.error("Error getting project stats:", error)
    return {
      total: 0,
      ideas: 0,
      inProgress: 0,
      completed: 0,
    }
  }
}