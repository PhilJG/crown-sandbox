# Neurosity Brain Data Visualization

This project connects to a Neurosity headset to visualize brain activity data in real-time. It provides multiple visualization modes to represent different aspects of brain activity, particularly focusing on calm and focus metrics.

## Project Structure

```
.
├── index.js              # Backend server and Neurosity connection
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── sketch-new.js     # Main frontend JavaScript
│   ├── sketch.js         # Legacy visualization code
│   └── visualizations/   # Visualization components
│       ├── circle.js     # Circular visualization
│       └── wave.js       # Waveform visualization
├── .env                  # Environment configuration
└── package.json          # Project dependencies
```

## Data Flow

1. **Device Connection**:
   - The backend connects to the Neurosity headset using the `@neurosity/notion` SDK
   - Authentication is handled via device ID, email, and password from the `.env` file

2. **Data Processing**:
   - The backend subscribes to brain activity metrics (calm, focus, etc.)
   - Raw data is processed and normalized
   - Data is broadcast to all connected WebSocket clients

3. **Visualization**:
   - The frontend establishes a WebSocket connection to the server
   - Multiple visualization components can be toggled via the UI
   - Visualizations update in real-time based on incoming brain data

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Neurosity credentials:
   ```
   DEVICE_ID=your_device_id
   EMAIL=your_email@example.com
   PASSWORD=your_password
   ```

3. Start the server:
   ```bash
   node index.js
   ```

4. Open `http://localhost:3000` in your browser

## Available Visualizations

- **Circle Visualization**: Displays brain activity in a circular pattern
- **Wave Visualization**: Shows brain activity as a dynamic waveform

## Dependencies

- Backend:
  - `@neurosity/notion`: Neurosity SDK
  - `express`: Web server
  - `ws`: WebSocket server
  - `dotenv`: Environment variable management

- Frontend:
  - HTML5 Canvas for rendering
  - Vanilla JavaScript (no external frameworks required)

## Usage

1. Put on your Neurosity headset and ensure it's connected
2. Open the web interface
3. Use the menu to switch between different visualization modes
4. Observe your brain activity in real-time

## License

This project is open source and available under the MIT License.
