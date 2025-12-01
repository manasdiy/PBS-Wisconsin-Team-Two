// pages/EditPage.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EditPage.css";

export default function EditPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const waveformScrollRef = useRef(null);
  const logBoxRef = useRef(null);
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

  const PIXELS_PER_SECOND = 200; // canvas width scale - tuneable

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

        // detect long-silence regions
        const silentRegions = findSilenceRegions(audioBuffer, 0.01, 1.2);
        audioBufferRef.current.silenceRegions = silentRegions;
        // detect loud regions (RMS > threshold) — based on audio standards
        const loudRegions = findLoudRegions(audioBuffer, 0.6, 0.5);
        audioBufferRef.current.loudRegions = loudRegions;
        // detect click/distortion regions (clipping or abrupt sample jumps)
        const clickRegions = findClickRegions(audioBuffer, 0.98, 0.75, 0.01);
        audioBufferRef.current.clickRegions = clickRegions;
        // Clear any existing logs for a fresh file
        if (logBoxRef.current) logBoxRef.current.innerHTML = '';
        // Add log entries for detected silence regions
        if (silentRegions && silentRegions.length > 0) {
          silentRegions.forEach(region => {
            appendLogEntry(region.startTime, region.endTime, 'Silence');
          });
        }

        // Add log entries for detected loud regions
        if (loudRegions && loudRegions.length > 0) {
          loudRegions.forEach(region => {
            appendLogEntry(region.startTime, region.endTime, 'Too Loud');
          });
        }
        // Add log entries for detected click/distortion regions
        if (clickRegions && clickRegions.length > 0) {
          clickRegions.forEach(region => {
            appendLogEntry(region.startTime, region.endTime, 'Click');
          });
        }
        // If no silence nor loudness warnings were detected, output a simple message
        if ((!silentRegions || silentRegions.length === 0) && (!loudRegions || loudRegions.length === 0) && (!clickRegions || clickRegions.length === 0)) {
          appendLogMessage('No warnings detected');
        }

        // compute proportional canvas width based on audio duration and clamp it
        const MAX_CANVAS_WIDTH = 2400; // prevents extremely wide canvases that push layout
        const desiredWidth = Math.max(1200, Math.min(Math.ceil(audioBuffer.duration * PIXELS_PER_SECOND), MAX_CANVAS_WIDTH));
        canvas.width = desiredWidth;
        canvas.height = 300;
        // Make the canvas virtual drawing buffer big, but set the CSS width to the DOM to desiredWidth
        // so that the `.waveform-scroll` can contain it and show a horizontal scrollbar.
        canvas.style.width = `${desiredWidth}px`;
        canvas.style.height = `300px`;
        // ensure we start scrolled to the beginning
        if (waveformScrollRef.current) waveformScrollRef.current.scrollLeft = 0;
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

    // AUTO-SCROLL: keep playhead centered (or as close as possible) while playing
    if (isPlaying) {
      const container = waveformScrollRef.current;
      if (container) {
        const visibleWidth = container.clientWidth;
        const maxScrollLeft = container.scrollWidth - visibleWidth;
        let targetScrollLeft = lineX - (visibleWidth / 2);
        if (targetScrollLeft < 0) targetScrollLeft = 0;
        if (targetScrollLeft > maxScrollLeft) targetScrollLeft = maxScrollLeft;
        // update only if it's noticeably different to avoid janky small updates
        if (Math.abs(container.scrollLeft - targetScrollLeft) > 1) {
          container.scrollLeft = targetScrollLeft;
        }
      }
    }
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

    if (audioBuffer.silenceRegions) {
      context.fillStyle = 'rgba(255, 0, 0, 0.35)';

      audioBuffer.silenceRegions.forEach(region => {
        const startX = (region.startTime / audioBuffer.duration) * canvas.width;
        const endX = (region.endTime / audioBuffer.duration) * canvas.width;
        const w = endX - startX;

        context.fillRect(startX, 0, w, canvas.height);
      });
    }

    if (audioBuffer.loudRegions) {
      context.fillStyle = 'rgba(255, 165, 0, 0.35)';
      audioBuffer.loudRegions.forEach(region => {
        const startX = (region.startTime / audioBuffer.duration) * canvas.width;
        const endX = (region.endTime / audioBuffer.duration) * canvas.width;
        const w = endX - startX;
        context.fillRect(startX, 0, w, canvas.height);
      });
    }

    if (audioBuffer.clickRegions) {
      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      audioBuffer.clickRegions.forEach(region => {
        const startX = (region.startTime / audioBuffer.duration) * canvas.width;
        const endX = (region.endTime / audioBuffer.duration) * canvas.width;
        const w = Math.max(2, endX - startX);
        // draw a narrow vertical bar to highlight short clicks
        context.fillRect(startX, 0, w, canvas.height);
      });
    }
  };

  const findSilenceRegions = (audioBuffer, silenceThreshold = 0.01, minSilenceSecs = 1.2) => {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const minSamples = Math.floor(minSilenceSecs * sampleRate);

    let silenceRegions = [];
    let idx = 0;

    while (idx < data.length) {
      if (Math.abs(data[idx]) < silenceThreshold) {
        const start = idx;
        while (idx < data.length && Math.abs(data[idx]) < silenceThreshold) {
          idx++;
        }
        const duration = idx - start;
        if (duration >= minSamples) {
          silenceRegions.push({
            startTime: start / sampleRate,
            endTime: idx / sampleRate,
          });
        }
      }
      idx++;
    }

    return silenceRegions;
  };

  // Detect regions where RMS volume exceeds threshold for at least minLoudSecs
  // - rmsThreshold is in amplitude (0.0 - 1.0), adjust to fit the audio standard
  const findLoudRegions = (audioBuffer, rmsThreshold = 0.6, minLoudSecs = 0.5) => {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.floor(0.05 * sampleRate); // 50ms windows
    const hop = Math.floor(windowSize / 2);

    let loudRegions = [];
    let idx = 0;
    const minWindows = Math.ceil((minLoudSecs * sampleRate) / hop);

    const makeWindowRMS = (start) => {
      let sum = 0;
      let count = 0;
      for (let i = start; i < Math.min(start + windowSize, data.length); i++) {
        const v = data[i];
        sum += v * v;
        count++;
      }
      if (count === 0) return 0;
      return Math.sqrt(sum / count);
    };

    let currentStart = null;
    let consecutiveWindows = 0;

    for (let start = 0; start < data.length; start += hop) {
      const rms = makeWindowRMS(start);
      if (rms >= rmsThreshold) {
        if (currentStart === null) currentStart = start;
        consecutiveWindows++;
      } else {
        if (currentStart !== null) {
          // only save if region was long enough
          if (consecutiveWindows >= minWindows) {
            const startSample = currentStart;
            const endSample = start + windowSize;
            loudRegions.push({
              startTime: startSample / sampleRate,
              endTime: Math.min(endSample, data.length) / sampleRate,
            });
          }
          currentStart = null;
          consecutiveWindows = 0;
        }
      }
    }

    // flush open region at end
    if (currentStart !== null && consecutiveWindows >= minWindows) {
      const startSample = currentStart;
      const endSample = data.length - 1;
      loudRegions.push({ startTime: startSample / sampleRate, endTime: endSample / sampleRate });
    }

    return loudRegions;
  };

  // Detect short clicks or distortion from clipping/abrupt sample jumps
  const findClickRegions = (audioBuffer, amplitudeThreshold = 0.98, deltaThreshold = 0.75, minClickSecs = 0.01) => {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const len = data.length;
    const maxGapSamples = Math.floor(0.02 * sampleRate); // 20ms gap to join impulses
    const minClickSamples = Math.ceil(minClickSecs * sampleRate);

    let regions = [];
    let inRegion = false;
    let regionStart = 0;
    let lastTrigger = 0;

    for (let i = 1; i < len; i++) {
      const curr = data[i];
      const prev = data[i - 1];
      const absCurr = Math.abs(curr);
      const absDiff = Math.abs(curr - prev);

      const clipping = absCurr >= amplitudeThreshold;
      const abrupt = absDiff >= deltaThreshold;

      if (clipping || abrupt) {
        if (!inRegion) {
          inRegion = true;
          regionStart = i - 1;
        }
        lastTrigger = i;
      }

      if (inRegion && (i - lastTrigger) > maxGapSamples) {
        const regionEnd = lastTrigger;
        const durationSamples = regionEnd - regionStart;
        if (durationSamples >= minClickSamples) {
          regions.push({ startTime: regionStart / sampleRate, endTime: regionEnd / sampleRate });
        }
        inRegion = false;
        regionStart = 0;
        lastTrigger = 0;
      }
    }

    if (inRegion) {
      const regionEnd = len - 1;
      const durationSamples = regionEnd - regionStart;
      if (durationSamples >= minClickSamples) {
        regions.push({ startTime: regionStart / sampleRate, endTime: regionEnd / sampleRate });
      }
    }

    return regions;
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
    // get scroll container so we can account for horizontal scrolling
    const scrollContainer = waveformScrollRef.current;
    const xVisible = e.clientX - rect.left; // position inside visible viewport
    const xAbsolute = xVisible + (scrollContainer ? scrollContainer.scrollLeft : 0);
    // Use scrollWidth to compute progress (both in DOM pixels)
    const progress = xAbsolute / (scrollContainer ? scrollContainer.scrollWidth : rect.width);
    audio.currentTime = progress * duration;
  };

  const formatTime = (time) => {
    // Format as H:MM:SS (hours optional) – match example 0:00:00
    const totalSeconds = Math.floor(time || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Append a formatted message to the log box DOM element
  const appendLogMessage = (message, typeClass = '') => {
    const box = logBoxRef.current || document.getElementById('logBox');
    if (!box) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'log-entry' + (typeClass ? ` ${typeClass}` : '');
    msgEl.textContent = message;
    box.appendChild(msgEl);
    // Auto-scroll to bottom
    box.scrollTop = box.scrollHeight;
  };

  const appendLogEntry = (startTime, endTime, reason) => {
    const formatted = `${formatTime(startTime)} to ${formatTime(endTime)} - ${reason}`;
    // Add type-based class so we can style messages (e.g. Silence vs Too Loud)
    const typeClass = 'log-' + reason.toLowerCase().replace(/\s+/g, '-');
    appendLogMessage(formatted, typeClass);
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
        <div className="waveform-layout">

          <div className="waveform-container">
            <div className="waveform-scroll" ref={waveformScrollRef}>
              <canvas
                ref={canvasRef}
                className="waveform-canvas"
                onClick={handleCanvasClick}
              />
            </div>

            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="log-container">
            <h3>Log</h3>
            <div ref={logBoxRef} className="log-box" id="logBox"></div>
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