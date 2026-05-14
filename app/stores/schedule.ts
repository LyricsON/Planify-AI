import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScheduleStore = defineStore('schedule', () => {
  const { get } = useApi()
  const deadlines = ref<any[]>([])
  const isLoadingDeadlines = ref(false)

  async function fetchDeadlines() {
    isLoadingDeadlines.value = true
    try {
      const [tasksRes, examsRes] = await Promise.all([
        get<any>('/tasks', { status: 'todo', limit: 10 }),
        get<any>('/exams', { status: 'upcoming', limit: 10 })
      ])
      
      const tasksRaw = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data?.data || []
      const examsRaw = Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.data || []

      const tasks = tasksRaw.map((t: any) => {
        const d = new Date(t.deadline || new Date())
        return {
          id: t._id || Math.random().toString(),
          day: d.getDate().toString(),
          month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
          title: t.title,
          subtitle: typeof t.courseId === 'object' && t.courseId ? t.courseId.title : 'Task',
          priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
          date: d
        }
      })
      
      const exams = examsRaw.map((e: any) => {
        const d = new Date(e.examDate || new Date())
        return {
          id: e._id || Math.random().toString(),
          day: d.getDate().toString(),
          month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
          title: e.title,
          subtitle: typeof e.courseId === 'object' && e.courseId ? e.courseId.title : (e.type || 'Exam'),
          priority: e.priority ? e.priority.charAt(0).toUpperCase() + e.priority.slice(1) : 'High',
          date: d
        }
      })
      
      deadlines.value = [...tasks, ...exams]
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3)
        
    } catch (error) {
      console.error('Failed to fetch deadlines', error)
      deadlines.value = []
    } finally {
      isLoadingDeadlines.value = false
    }
  }

  // Legend Data mapping to the 8 explicit types in the screenshot
  const legendItems = ref([
    { id: '1', label: 'Classes', description: 'Lectures, Tutorials, Labs', color: 'bg-blue-500' },
    { id: '2', label: 'TD', description: 'Travaux Dirigés', color: 'bg-sky-500' },
    { id: '3', label: 'TP', description: 'Travaux Pratiques', color: 'bg-cyan-500' },
    { id: '4', label: 'Exams', description: 'Tests, Quizzes, Exams', color: 'bg-purple-500' },
    { id: '5', label: 'Study Sessions', description: 'Deep work & revision', color: 'bg-emerald-500' },
    { id: '6', label: 'Tasks', description: 'Assignments, To-dos', color: 'bg-orange-500' },
    { id: '7', label: 'Breaks', description: 'Rest & personal time', color: 'bg-slate-400' },
    { id: '8', label: 'Personal', description: 'Personal time', color: 'bg-pink-500' },
  ])

  return { deadlines, isLoadingDeadlines, fetchDeadlines, legendItems }
})
