# 🌱 GoTouchGrass

**Touch grass, you terminally online creature!**

A modern React app that helps you find the nearest patch of grass to touch. Stop doomscrolling and go outside for once.

## 🎯 What This App Does

- **Finds nearby grass**: Uses OpenStreetMap data to locate parks, gardens, meadows, and other green spaces
- **Gives you directions**: Shows you exactly how to get to your grass-touching destination
- **Saves your soul**: Prevents you from becoming one with your chair

## 🚀 Features

- **Comprehensive green space search**: Parks, gardens, meadows, recreation grounds, allotments, and more
- **Modern, clean UI**: Beautiful design that doesn't hurt your eyes (unlike your Twitter feed)
- **Real-time location**: Uses your current location or search by address
- **Interactive maps**: Google Maps integration with custom grass area highlighting
- **Rage-inducing humor**: Because you need motivation to go outside

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Google Maps API** for mapping
- **OpenStreetMap Overpass API** for green space data
- **Lucide React** for icons

## 🏃‍♂️ Quick Start

1. **Clone this repo** (if you can tear yourself away from social media)
   ```bash
   git clone https://github.com/yourusername/gotouchgrass-app.git
   cd gotouchgrass-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment**
   ```bash
   cp .env.example .env
   # Add your Google Maps API key to .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Touch some grass** 🌱

## 🔧 Environment Variables

Create a `.env` file with:
```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 📱 How to Use

1. **Enter your location** or let the app use your current position
2. **Wait for the magic** as it searches for nearby green spaces
3. **Click on a green area** to get directions
4. **Actually go outside** and touch some grass (this is the hard part)

## 🌍 OSM Data Sources

The app searches for these types of green spaces:
- `landuse=grass` - Designated grass areas
- `natural=grassland` - Natural grassland features
- `leisure=park` - Public parks and recreational areas
- `leisure=garden` - Botanical gardens, public gardens
- `landuse=recreation_ground` - Sports fields, playgrounds
- `landuse=meadow` - Natural meadows
- `landuse=allotments` - Community gardens
- `amenity=park` - Legacy park tagging

## 🤝 Contributing

Found a bug? Want to add more ragebait? Feel free to contribute!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - Go touch some grass instead of reading licenses.

## 🙏 Acknowledgments

- **OpenStreetMap contributors** for the green space data
- **Google Maps** for the mapping platform
- **Your chair** for being so comfortable that you need this app

---

**Remember: The grass is always greener where you water it. But first, you have to actually go outside and touch it.** 🌱 