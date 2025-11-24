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
  const audioDataRef = useRef(null); // Store extracted audio data
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

        // Extract and store audio data points
        const extractedData = extractAudioData(audioBuffer);
        audioDataRef.current = extractedData;

        // Log the extracted data to console for verification
        console.log('Audio Metadata:', extractedData.metadata);
        console.log('Peak Regions:', extractedData.peaks);
        console.log('Low Regions:', extractedData.lows);
        console.log('Silent Regions:', extractedData.silentRegions);
        console.log('Loud Regions:', extractedData.loudRegions);
        console.log('Overall Statistics:', extractedData.statistics);

        drawWaveform(audioBuffer, canvas, canvasContext);
      })
      .catch(error => console.error('Error loading audio:', error));

    return () => audioContext.close();
  }, [audioUrl]);

  const extractAudioData = (audioBuffer) => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Basic metadata
    const metadata = {
      sampleRate: sampleRate,
      channels: audioBuffer.numberOfChannels,
      duration: duration,
      length: audioBuffer.length,
      bitDepth: 'Float32'
    };

    // Calculate statistics
    let sum = 0;
    let sumSquares = 0;
    let maxAmplitude = 0;
    let minAmplitude = 0;

    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      sum += Math.abs(sample);
      sumSquares += sample * sample;
      if (sample > maxAmplitude) maxAmplitude = sample;
      if (sample < minAmplitude) minAmplitude = sample;
    }

    const meanAmplitude = sum / channelData.length;
    const rms = Math.sqrt(sumSquares / channelData.length);

    const statistics = {
      maxAmplitude,
      minAmplitude,
      meanAmplitude,
      rms,
      dynamicRange: maxAmplitude - minAmplitude
    };

    // Extract peaks and lows with time segments
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const peaks = [];
    const lows = [];
    const silentRegions = [];
    const loudRegions = [];

    // Thresholds
    const peakThreshold = rms * 2; // Peaks are 2x RMS
    const lowThreshold = rms * 0.3; // Lows are 30% of RMS
    const silenceThreshold = rms * 0.1; // Silence is 10% of RMS
    const loudThreshold = rms * 3; // Loud is 3x RMS

    for (let i = 0; i < channelData.length; i += windowSize) {
      const windowEnd = Math.min(i + windowSize, channelData.length);
      let windowMax = 0;
      let windowMin = 0;
      let windowSumSquares = 0;
      let windowSamples = 0;

      // Analyze window
      for (let j = i; j < windowEnd; j++) {
        const sample = channelData[j];
        if (Math.abs(sample) > Math.abs(windowMax)) windowMax = sample;
        if (Math.abs(sample) < Math.abs(windowMin) || windowMin === 0) windowMin = sample;
        windowSumSquares += sample * sample;
        windowSamples++;
      }

      const windowRms = Math.sqrt(windowSumSquares / windowSamples);
      const timeStart = i / sampleRate;
      const timeEnd = windowEnd / sampleRate;

      // Detect peaks
      if (Math.abs(windowMax) > peakThreshold) {
        peaks.push({
          time: timeStart,
          timeEnd: timeEnd,
          amplitude: windowMax,
          rms: windowRms
        });
      }

      // Detect lows
      if (Math.abs(windowMax) < lowThreshold && windowRms < lowThreshold) {
        lows.push({
          time: timeStart,
          timeEnd: timeEnd,
          amplitude: windowMax,
          rms: windowRms
        });
      }

      // Detect silent regions
      if (windowRms < silenceThreshold) {
        silentRegions.push({
          time: timeStart,
          timeEnd: timeEnd,
          rms: windowRms
        });
      }

      // Detect loud regions
      if (windowRms > loudThreshold) {
        loudRegions.push({
          time: timeStart,
          timeEnd: timeEnd,
          rms: windowRms
        });
      }
    }

    // Merge consecutive regions
    const mergeRegions = (regions) => {
      if (regions.length === 0) return [];

      const merged = [];
      let current = { ...regions[0] };

      for (let i = 1; i < regions.length; i++) {
        // If regions are consecutive (within 0.2 seconds), merge them
        if (regions[i].time - current.timeEnd < 0.2) {
          current.timeEnd = regions[i].timeEnd;
          current.rms = (current.rms + regions[i].rms) / 2; // Average RMS
        } else {
          merged.push(current);
          current = { ...regions[i] };
        }
      }
      merged.push(current);

      return merged;
    };

    return {
      metadata,
      statistics,
      peaks: mergeRegions(peaks),
      lows: mergeRegions(lows),
      silentRegions: mergeRegions(silentRegions),
      loudRegions: mergeRegions(loudRegions),
      rawData: {
        channelData: channelData, // Full waveform data
        sampleRate: sampleRate
      }
    };
  };

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