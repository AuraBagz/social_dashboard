import { useState } from 'react'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import { Calendar, Clock, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react'

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Schedule() {
  const { scheduledPosts, deletePost, platforms } = useSocial()
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getPostsForDay = (day) => {
    return scheduledPosts.filter(post => {
      const d = new Date(post.scheduledFor)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  const today = new Date()
  const isToday = (day) => day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Schedule</h1>
        <p className="text-gray-400 text-sm mt-1">Plan and manage your upcoming posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {months[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayPosts = day ? getPostsForDay(day) : []
                return (
                  <div
                    key={i}
                    className={`
                      min-h-[80px] rounded-lg p-1.5 text-xs transition-colors
                      ${day ? 'bg-dark-700 hover:bg-dark-600 cursor-pointer' : ''}
                      ${isToday(day) ? 'ring-1 ring-gold/50' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <span className={`font-medium ${isToday(day) ? 'text-gold' : 'text-gray-400'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayPosts.slice(0, 3).map(post => (
                            <div
                              key={post.id}
                              className="flex items-center gap-1 px-1 py-0.5 rounded bg-gold/10 truncate"
                            >
                              {post.platforms?.slice(0, 2).map(pid => (
                                <PlatformIcon key={pid} platform={pid} size={8} className="text-gray-400 shrink-0" />
                              ))}
                              <span className="text-[10px] text-gray-300 truncate">{post.content?.slice(0, 15)}</span>
                            </div>
                          ))}
                          {dayPosts.length > 3 && (
                            <span className="text-[10px] text-gray-500 px-1">+{dayPosts.length - 3} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming - 1 col */}
        <div className="space-y-4">
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-gold" />
              Upcoming Posts
            </h3>

            {scheduledPosts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No scheduled posts</p>
                <p className="text-xs text-gray-600 mt-1">Use the Compose page to schedule posts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts
                  .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
                  .map(post => (
                    <div key={post.id} className="bg-dark-700 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        {post.platforms?.map(pid => {
                          const p = platforms.find(x => x.id === pid)
                          return p ? (
                            <PlatformIcon key={pid} platform={pid} size={12} style={{ color: p.color }} />
                          ) : null
                        })}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(post.scheduledFor).toLocaleDateString()} at{' '}
                          {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1 text-gray-500 hover:text-accent-red transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
