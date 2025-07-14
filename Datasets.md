# Neurosity SDK EEG Datasets: Explanation and Expected Results

This document explains the EEG datasets provided by the Neurosity SDK (`alpha-reactive-state`, `eyes-closed`, `visual-evoked-potential`, `alpha-resting-state`, and `ssvep`) and outlines the expected EEG results for each, based on typical EEG characteristics and neuroscience principles.

## 1. Alpha-Reactive-State

**Description**: Captures brain activity when alpha rhythms (8–12 Hz) respond to stimuli or tasks, often showing alpha suppression (event-related desynchronization, ERD) during cognitive or sensory engagement.

**Expected EEG Results**:

- **Frequency Band**: Alpha (8–12 Hz).
- **Power Changes**: Decreased alpha power (ERD) during tasks like mental arithmetic or visual attention, compared to baseline.
- **Spatial Distribution**: Strongest in posterior channels (O1, O2, PO3, PO4, CP3, CP4).
- **Key Observations**:
  - Look for alpha power reduction post-stimulus/task onset.
  - Analyze ERD in occipital/parietal channels.
  - Variability may occur due to individual differences or task demands.

## 2. Eyes-Closed

**Description**: A baseline condition capturing enhanced alpha activity during relaxed wakefulness with eyes closed, reducing visual input.

**Expected EEG Results**:

- **Frequency Band**: Alpha (8–12 Hz).
- **Power Changes**: Increased alpha power compared to eyes-open or task conditions.
- **Spatial Distribution**: Prominent in occipital (O1, O2) and parietal (PO3, PO4) channels.
- **Key Observations**:
  - High alpha power in posterior regions.
  - Compare with eyes-open data to confirm alpha enhancement.
  - Check for artifacts (e.g., eye blinks, muscle activity).

## 3. Visual-Evoked-Potential (VEP)

**Description**: EEG responses to visual stimuli (e.g., flashes or checkerboards), reflecting visual cortex activation. Likely transient VEPs, time-locked to stimulus onset.

**Expected EEG Results**:

- **Frequency Band**: Broad (time-locked responses, not frequency-specific).
- **Temporal Characteristics**: Distinct peaks like P100 (~100 ms post-stimulus), N75, or N145.
- **Spatial Distribution**: Strongest in occipital channels (O1, O2, PO3, PO4).
- **Key Observations**:
  - Identify P100 and other VEP components in averaged epochs.
  - Check stimulus properties (e.g., contrast, frequency) for amplitude/latency effects.
  - Average multiple trials to improve signal-to-noise ratio (SNR).

## 4. Alpha-Resting-State

**Description**: Captures spontaneous alpha activity during a relaxed state with minimal cognitive engagement, serving as a baseline for comparison.

**Expected EEG Results**:

- **Frequency Band**: Alpha (8–12 Hz).
- **Power Changes**: Moderate to high alpha power, higher if eyes closed.
- **Spatial Distribution**: Dominant in occipital (O1, O2) and parietal (PO3, PO4, CP3, CP4) channels.
- **Key Observations**:
  - Analyze individual alpha frequency (IAF) for peak frequency variations.
  - Higher alpha power with eyes closed vs. eyes open.
  - Screen for artifacts contaminating the signal.

## 5. Steady-State Visually Evoked Potential (SSVEP)

**Description**: Oscillatory brain responses to repetitive visual stimuli (e.g., flickering lights), synchronizing EEG activity to the stimulus frequency. Used in brain-computer interfaces (BCIs).

**Expected EEG Results**:

- **Frequency Band**: Peaks at stimulus frequency and harmonics (e.g., 10 Hz stimulus shows peaks at 10 Hz, 20 Hz, 30 Hz).
- **Power Changes**: Strong, narrowband power increases at stimulus frequencies.
- **Spatial Distribution**: Prominent in occipital channels (O1, O2, PO3, PO4).
- **Key Observations**:
  - Identify power peaks at stimulus frequencies using FFT/PSD.
  - Check dataset for specific frequencies (e.g., 6–15 Hz).
  - Look for intermodulation components if multiple frequencies are used.
  - High SNR makes SSVEPs robust for detection.

## General Analysis Guidelines

- **Neurosity SDK**: Use `brainwaves("raw")` for time-domain EEG or `brainwaves("powerByBand")` for precomputed alpha, beta, etc., power across channels (CP3, C3, F5, PO3, PO4, F6, C4, CP4).
- **Preprocessing**:
  - Apply bandpass filter (1–40 Hz) to remove noise.
  - Use ICA for artifact removal (e.g., eye blinks, muscle activity).
  - Epoch data for VEP/SSVEP around stimulus onsets.
- **Analysis Tools**:
  - FFT/PSD for frequency analysis (alpha, SSVEP).
  - Epoch averaging for VEPs to highlight time-locked components.
  - Use MNE-Python, EEGLAB, or MATLAB for processing.
- **Validation**: Confirm stimulus frequencies or task protocols in dataset documentation.

## Summary Table

| Dataset                 | Key Frequency Band  | Expected EEG Features                            | Primary Channels           |
| ----------------------- | ------------------- | ------------------------------------------------ | -------------------------- |
| Alpha-Reactive-State    | Alpha (8–12 Hz)     | Reduced alpha power (ERD) during tasks           | O1, O2, PO3, PO4, CP3, CP4 |
| Eyes-Closed             | Alpha (8–12 Hz)     | Increased alpha power; rhythmic oscillations     | O1, O2, PO3, PO4           |
| Visual-Evoked-Potential | Broad (time-locked) | P100 (~100 ms), N75, N145 peaks                  | O1, O2, PO3, PO4           |
| Alpha-Resting-State     | Alpha (8–12 Hz)     | Moderate/high alpha power; higher if eyes closed | O1, O2, PO3, PO4, CP3, CP4 |
| SSVEP                   | Stimulus-specific   | Power peaks at stimulus frequency and harmonics  | O1, O2, PO3, PO4           |

For further assistance with processing or code snippets, provide dataset specifics (e.g., stimulus frequencies, channel configurations).
