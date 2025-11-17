// pages/EditPage.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditPage.css";

export default function EditPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const audioBufferRef = useRef(null); // Store the audio buffer
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const file = location.state?.file;

    if (!file) {
      navigate('/');
      return;
    }

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [location, navigate]);

  useEffect(() => {
    if (!audioUrl) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');

    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        audioBufferRef.current = audioBuffer; // Store for later use
        drawWaveform(audioBuffer, canvas, canvasContext);
      })
      .catch(error => console.error('Error loading audio:', error));

    return () => audioContext.close();
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!canvas || !duration || !audioBuffer) return;

    const drawFrame = () => {
      const context = canvas.getContext('2d');

      // Redraw the entire waveform first
      drawWaveform(audioBuffer, canvas, context);

      // Then draw the progress line on top
      const progress = currentTime / duration;
      const lineX = canvas.width * progress;

      // Draw progress line
      context.strokeStyle = '#7c3aed';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(lineX, 0);
      context.lineTo(lineX, canvas.height);
      context.stroke();

      // Draw playhead circle
      context.fillStyle = '#7c3aed';
      context.beginPath();
      context.arc(lineX, canvas.height / 2, 8, 0, Math.PI * 2);
      context.fill();
    };

    if (isPlaying) {
      const animate = () => {
        drawFrame();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      drawFrame();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentTime, duration, isPlaying]);

  const drawWaveform = (audioBuffer, canvas, context) => {
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    // Light purple background
    context.fillStyle = '#f4f1ff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Light purple waveform
    context.strokeStyle = '#b4a5d6';
    context.lineWidth = 2;

    context.beginPath();
    context.moveTo(0, amp);

    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      context.lineTo(i, (1 + min) * amp);
    }

    for (let i = canvas.width - 1; i >= 0; i--) {
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum > max) max = datum;
      }

      context.lineTo(i, (1 + max) * amp);
    }

    context.closePath();
    context.stroke();
    context.fillStyle = 'rgba(180, 165, 214, 0.2)';
    context.fill();
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / canvas.width;
    audio.currentTime = progress * duration;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="edit-page">
      {/* Header with Audio Editor title */}
      <header className="edit-header">
        <h1 className="edit-title">Audio Editor</h1>
      </header>

      {/* File name */}
      <div className="file-name-display">
        <p className="file-name-text">{fileName}</p>
      </div>

      {/* Waveform */}
      <div className="waveform-section">
        <div className="waveform-container">
          <canvas
            ref={canvasRef}
            width={1200}
            height={300}
            className="waveform-canvas"
            onClick={handleCanvasClick}
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Pause button */}
      <div className="audio-controls">
        <audio ref={audioRef} src={audioUrl} />
        <button className="pause-button" onClick={togglePlayPause}>
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
      </div>
    </div>
  );
}