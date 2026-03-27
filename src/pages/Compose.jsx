import { useState, useRef } from 'react'
import { useSocial } from '../context/SocialContext.jsx'
import PlatformIcon from '../components/PlatformIcon.jsx'
import { Image, Video, Send, Clock, Check, X, Paperclip, Smile, AlertCircle, Hash, MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function Compose() {
  const { connectedPlatforms, addPost, publishPost } = useSocial()
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState(new Set())
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [posting, setPosting] = useState(false)
  const [postResults, setPostResults] = useState(null)
  const fileInput = useRef(null)

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedPlatforms(new Set(connectedPlatforms.map(p => p.id)))
  }

  const handleMedia = (e) => {
    const files = Array.from(e.target.files || [])
    setMediaFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      setMediaPreviews(prev => [...prev, { url, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name }])
    })
  }

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!content.trim() || selectedPlatforms.size === 0) return
    setPosting(true)
    setPostResults(null)

    const targetPlatforms = Array.from(selectedPlatforms)

    if (showSchedule && scheduleDate && scheduleTime) {
      // Schedule for later (local only for now)
      addPost({
        content,
        platforms: targetPlatforms,
        media: mediaFiles,
        scheduledFor: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
      })
      setPostResults({ _scheduled: true })
      setPosting(false)
      resetForm()
      return
    }

    try {
      // Publish immediately to real platforms
      const data = await publishPost(content, targetPlatforms)
      setPostResults(data.results)

      // Also track locally
      addPost({ content, platforms: targetPlatforms, media: mediaFiles })
    } catch (err) {
      setPostResults({ _error: err.message })
    } finally {
      setPosting(false)
    }
  }

  const resetForm = () => {
    setTimeout(() => {
      setContent('')
      setSelectedPlatforms(new Set())
      setMediaFiles([])
      setMediaPreviews([])
      setShowSchedule(false)
      setScheduleDate('')
      setScheduleTime('')
      setPostResults(null)
    }, 5000)
  }

  const getCharWarning = () => {
    const warnings = []
    for (const p of connectedPlatforms) {
      if (selectedPlatforms.has(p.id) && content.length > p.maxChars) {
        warnings.push({ platform: p.name, max: p.maxChars, over: content.length - p.maxChars })
      }
    }
    return warnings
  }

  const charWarnings = getCharWarning()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Compose Post</h1>
        <p className="text-gray-400 text-sm mt-1">Create and publish to your connected platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-transparent px-5 pt-5 pb-2 text-white text-sm focus:outline-none resize-none"
              rows={8}
              placeholder="Share an update about AI for law firms, industry insights, or company news..."
            />

            {mediaPreviews.length > 0 && (
              <div className="px-5 pb-3 flex gap-2 flex-wrap">
                {mediaPreviews.map((media, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-dark-700">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video size={20} className="text-gray-500" />
                      </div>
                    )}
                    <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 px-3 py-2.5 border-t border-dark-600">
              <button onClick={() => fileInput.current?.click()} className="p-2 text-gray-400 hover:text-gold transition-colors rounded-lg hover:bg-dark-700" title="Add media">
                <Image size={18} />
              </button>
              <input ref={fileInput} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMedia} />
              <button className="p-2 text-gray-400 hover:text-gold transition-colors rounded-lg hover:bg-dark-700" title="Add hashtag">
                <Hash size={18} />
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className={`text-xs ${content.length > 280 ? 'text-accent-orange' : 'text-gray-500'}`}>
                  {content.length} chars
                </span>
              </div>
            </div>
          </div>

          {charWarnings.length > 0 && (
            <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-accent-orange mt-0.5 shrink-0" />
                <div className="text-xs text-gray-300">
                  {charWarnings.map(w => (
                    <p key={w.platform}>{w.platform}: {w.over} characters over limit ({w.max} max)</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Schedule option */}
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
            <button onClick={() => setShowSchedule(!showSchedule)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <Clock size={16} />
              {showSchedule ? 'Remove schedule' : 'Schedule for later'}
            </button>
            {showSchedule && (
              <div className="flex gap-3 mt-3">
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold" />
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold" />
              </div>
            )}
          </div>
        </div>

        {/* Platform selector - 1 col */}
        <div className="space-y-4">
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Post To</h3>
              {connectedPlatforms.length > 0 && (
                <button onClick={selectAll} className="text-xs text-gold hover:underline">All</button>
              )}
            </div>

            {connectedPlatforms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Connect platforms first</p>
            ) : (
              <div className="space-y-2">
                {connectedPlatforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      selectedPlatforms.has(platform.id)
                        ? 'bg-gold/10 border border-gold/30'
                        : 'bg-dark-700 border border-transparent hover:bg-dark-600'
                    }`}
                  >
                    <PlatformIcon platform={platform.id} size={16} style={{ color: platform.color }} />
                    <span className="text-sm text-gray-300 flex-1">{platform.name}</span>
                    {selectedPlatforms.has(platform.id) && <Check size={14} className="text-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handlePost}
            disabled={!content.trim() || selectedPlatforms.size === 0 || posting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold to-gold-dark text-dark-900 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? (
              <><Loader2 size={16} className="animate-spin" /> Publishing...</>
            ) : showSchedule ? (
              <><Clock size={16} /> Schedule Post</>
            ) : (
              <><Send size={16} /> Post to {selectedPlatforms.size || '...'} Platform{selectedPlatforms.size !== 1 ? 's' : ''}</>
            )}
          </button>

          {/* Post results */}
          {postResults && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
              <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Results</h4>
              {postResults._scheduled ? (
                <div className="flex items-center gap-2 text-accent-green text-sm">
                  <CheckCircle2 size={14} /> Post scheduled successfully
                </div>
              ) : postResults._error ? (
                <div className="flex items-center gap-2 text-accent-red text-sm">
                  <XCircle size={14} /> {postResults._error}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(postResults).map(([pid, result]) => {
                    const platform = connectedPlatforms.find(p => p.id === pid)
                    return (
                      <div key={pid} className="flex items-center gap-2 py-1">
                        {result.success
                          ? <CheckCircle2 size={14} className="text-accent-green" />
                          : <XCircle size={14} className="text-accent-red" />
                        }
                        <PlatformIcon platform={pid} size={12} style={{ color: platform?.color }} />
                        <span className="text-sm text-gray-300 flex-1">{platform?.name || pid}</span>
                        {!result.success && (
                          <span className="text-xs text-accent-red truncate max-w-[150px]" title={result.error}>
                            {result.error}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {content && (
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4">
              <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview</h4>
              <div className="bg-dark-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-dark" />
                  <span className="text-sm text-white font-medium">Stalefish</span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{content}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
