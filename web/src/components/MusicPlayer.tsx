import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStop, faPlus, faTrash, faMusic, faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons'
import './MusicPlayer.css'

interface Track {
  id: string
  title: string
  url: string
  thumbnail?: string
}

interface MusicPlayerProps {
  isOpen: boolean
  onClose: () => void
}

const MusicPlayer = ({ isOpen, onClose }: MusicPlayerProps) => {
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTrackUrl, setNewTrackUrl] = useState('')
  const [newTrackTitle, setNewTrackTitle] = useState('')

  useEffect(() => {
    // Load saved playlist from localStorage
    const saved = localStorage.getItem('musicPlaylist')
    if (saved) {
      setPlaylist(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Save playlist to localStorage
    localStorage.setItem('musicPlaylist', JSON.stringify(playlist))
  }, [playlist])

  const extractVideoId = (url: string): string | null => {
    // YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const addTrack = () => {
    if (!newTrackUrl.trim()) return

    const videoId = extractVideoId(newTrackUrl)
    if (!videoId) {
      // Send notification to game instead of alert
      fetch(`https://${(window as any).GetParentResourceName()}/showNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'error', 
          title: 'Invalid URL', 
          message: 'Please enter a valid YouTube link or video ID.' 
        })
      }).catch(() => {})
      return
    }

    const track: Track = {
      id: Date.now().toString(),
      title: newTrackTitle.trim() || `Track ${playlist.length + 1}`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
    }

    setPlaylist([...playlist, track])
    setNewTrackUrl('')
    setNewTrackTitle('')
    setShowAddDialog(false)
  }

  const removeTrack = (id: string) => {
    setPlaylist(playlist.filter(t => t.id !== id))
    if (currentTrack?.id === id) {
      stopMusic()
    }
  }

  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    
    // Send to client
    fetch(`https://${(window as any).GetParentResourceName?.() || 'solar-hud'}/playMusic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: track.url,
        volume: isMuted ? 0 : volume / 100
      })
    }).catch(() => {})
  }

  const togglePlayPause = () => {
    if (!currentTrack) {
      if (playlist.length > 0) {
        playTrack(playlist[0])
      }
      return
    }

    setIsPlaying(!isPlaying)
    
    fetch(`https://${(window as any).GetParentResourceName?.() || 'solar-hud'}/toggleMusic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playing: !isPlaying })
    }).catch(() => {})
  }

  const stopMusic = () => {
    setIsPlaying(false)
    setCurrentTrack(null)
    
    fetch(`https://${(window as any).GetParentResourceName?.() || 'solar-hud'}/stopMusic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {})
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    
    fetch(`https://${(window as any).GetParentResourceName?.() || 'solar-hud'}/setVolume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: isMuted ? 0 : newVolume / 100 })
    }).catch(() => {})
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    fetch(`https://${(window as any).GetParentResourceName?.() || 'solar-hud'}/setVolume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: !isMuted ? 0 : volume / 100 })
    }).catch(() => {})
  }

  if (!isOpen) return null

  return (
    <div className="music-player-overlay">
      <div className="music-player-container">
        {/* Header */}
        <div className="music-player-header">
          <div className="music-player-title">
            <FontAwesomeIcon icon={faMusic} />
            <span>Music Player</span>
          </div>
          <button className="music-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div className="now-playing">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="now-playing-thumbnail"
            />
            <div className="now-playing-info">
              <div className="now-playing-title">{currentTrack.title}</div>
              <div className="now-playing-controls">
                <button onClick={togglePlayPause} className="control-btn">
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
                <button onClick={stopMusic} className="control-btn">
                  <FontAwesomeIcon icon={faStop} />
                </button>
              </div>
            </div>
            <div className="volume-control">
              <button onClick={toggleMute} className="volume-btn">
                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
              </button>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="volume-slider"
              />
            </div>
          </div>
        )}

        {/* Playlist */}
        <div className="playlist-container">
          <div className="playlist-header">
            <span>Playlist ({playlist.length})</span>
            <button onClick={() => setShowAddDialog(true)} className="add-track-btn">
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Track</span>
            </button>
          </div>

          <div className="playlist-tracks">
            {playlist.length === 0 ? (
              <div className="empty-playlist">
                <FontAwesomeIcon icon={faMusic} size="2x" />
                <p>No tracks in playlist</p>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>Click "Add Track" to get started</p>
              </div>
            ) : (
              playlist.map(track => (
                <div 
                  key={track.id} 
                  className={`playlist-track ${currentTrack?.id === track.id ? 'active' : ''}`}
                >
                  <img src={track.thumbnail} alt={track.title} className="track-thumbnail" />
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                  </div>
                  <div className="track-actions">
                    <button onClick={() => playTrack(track)} className="track-play-btn">
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                    <button onClick={() => removeTrack(track.id)} className="track-delete-btn">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Track Dialog */}
        {showAddDialog && (
          <div className="add-track-dialog">
            <div className="dialog-content">
              <h3>Add New Track</h3>
              <input 
                type="text"
                placeholder="Track Title (optional)"
                value={newTrackTitle}
                onChange={(e) => setNewTrackTitle(e.target.value)}
                className="dialog-input"
              />
              <input 
                type="text"
                placeholder="YouTube URL or Video ID"
                value={newTrackUrl}
                onChange={(e) => setNewTrackUrl(e.target.value)}
                className="dialog-input"
                onKeyPress={(e) => e.key === 'Enter' && addTrack()}
              />
              <div className="dialog-actions">
                <button onClick={addTrack} className="dialog-btn primary">Add</button>
                <button onClick={() => setShowAddDialog(false)} className="dialog-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicPlayer
