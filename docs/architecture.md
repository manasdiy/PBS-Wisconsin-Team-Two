# PBS Wisconsin Audio Analysis System Architecture

**Author:** Diyaa Manasrah  
**Estimated Read Time:** 1 min  

---

This document describes each layer of our system architecture used for audio file analysis and reporting. The system detects and reports audio quality issues (e.g., silence, clipping, noise) through a modular, layered design that ensures scalability, maintainability, and clear data flow from upload to user report.

---

## Cloud Storage Layer

**Purpose:**  
Stores both original and processed audio files.

**Functionality:**
- Provides scalable, persistent storage for uploaded audio.  
- Enables quick retrieval of files for reprocessing or re-analysis.  
- Supports versioning and redundancy for reliability.

**Example Technologies:**  
AWS S3 · Google Cloud Storage · Azure Blob

---

## Database / Repository Layer

**Purpose:**  
Central hub for storing metadata, user information, and analysis results.

**Functionality:**
- Saves uploaded file metadata (file name, type, size, timestamps).  
- Stores analysis outputs and severity assessments.  
- Links user data to uploaded files and reports.

**Example Technologies:**  
PostgreSQL · MongoDB · Firebase Firestore

---

## Issue Detection and Reporting Layer

**Purpose:**  
Transforms raw analysis data into structured, interpretable reports.

**Functionality:**
- Applies thresholds to classify issue severity (minor, moderate, severe).  
- Timestamps detected issues within the audio timeline.  
- Structures data in JSON format and generates downloadable HTML reports.

**Output:**  
User-readable analysis summaries, charts, and severity reports.

---

## Audio Processing Service Layer

**Purpose:**  
Performs detailed signal analysis on uploaded audio files.

**Functionality:**
- Extracts waveform and spectral metadata.  
- Detects silence, clipping, noise, and other anomalies.  
- Computes loudness, peak levels, and frequency statistics.  
- Produces raw analysis data for downstream reporting.

**Example Technologies:**  
Python (librosa, pydub) · FFmpeg · TensorFlow Audio APIs

---

## Controller Layer

**Purpose:**  
Manages communication between the backend and the user interface.

**Functionality:**
- Handles all RESTful API requests from the frontend.  
- Performs authentication and authorization checks.  
- Passes processed results and report data to the web client.

**Example Technologies:**  
Spring Boot · Node.js · Flask

---

## Web Client Layer

**Purpose:**  
Serves as the user interface for uploads, visualizations, and report access.

**Functionality:**
- Allows users to upload audio files for analysis.  
- Displays reports, issue breakdowns, and severity levels.  
- Generates visual charts and downloadable reports (HTML format).

**Example Technologies:**  
React.js · HTML5 · CSS3 · Chart.js

---

