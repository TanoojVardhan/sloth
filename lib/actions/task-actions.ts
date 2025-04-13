"use server"

import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  tags?: string[]
  description?: string
}

const tasksCollection = collection(db, 'tasks');

// Add a new task
export const addTask = async (task: { title: string; description: string; completed: boolean }) => {
  try {
    const docRef = await addDoc(tasksCollection, task);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// Get all tasks
export const getTasks = async () => {
  try {
    const querySnapshot = await getDocs(tasksCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

// Update a task
export const updateTask = async (id: string, updatedTask: Partial<{ title: string; description: string; completed: boolean }>) => {
  try {
    const taskDoc = doc(db, 'tasks', id);
    await updateDoc(taskDoc, updatedTask);
  } catch (error) {
    throw error;
  }
};

// Delete a task
export const deleteTask = async (id: string) => {
  try {
    const taskDoc = doc(db, 'tasks', id);
    await deleteDoc(taskDoc);
  } catch (error) {
    throw error;
  }
};
