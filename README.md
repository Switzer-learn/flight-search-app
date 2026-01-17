# SkyScout - Flight Search Application

A modern, responsive flight search application built with Next.js 16, featuring real-time price visualization, advanced filtering, and seamless user experience.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [User Manual](#user-manual)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [API Configuration](#api-configuration)
- [Contributing](#contributing)

---

## ✨ Features

### Core Functionality
- **Smart Airport Autocomplete** - Instant airport search with zero latency using static data
- **One-Way & Round-Trip Search** - Flexible trip type selection
- **Passenger Selection** - Support for adults, children, and infants
- **Real-Time Price Visualization** - Interactive scatter plot showing price trends
- **Advanced Filtering** - Filter by stops, price range, airlines, and departure time
- **Multiple Sort Options** - Best, cheapest, fastest, earliest, latest
- **Responsive Design** - Optimized for desktop, tablet, and mobile

### User Experience
- **Smooth Animations** - Powered by Framer Motion
- **Loading States** - Skeleton screens and progress indicators
- **Error Handling** - Graceful error messages with retry options
- **URL Persistence** - Shareable search links
- **Keyboard Navigation** - Full accessibility support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Amadeus API credentials (free account at [developers.amadeus.com](https://developers.amadeus.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flight-search-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   AMADEUS_API_KEY=your_api_key_here
   AMADEUS_API_SECRET=your_api_secret_here
   AMADEUS_FLIGHT_OFFERS_URL=https://test.api.amadeus.com/v2/shopping/flight-offers
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 User Manual

### Searching for Flights

#### Step 1: Choose Trip Type
- **One Way**: Single journey from origin to destination
- **Round Trip**: Includes return flight (shows additional return date picker)

#### Step 2: Select Airports
- **Origin**: Type city name or airport code (e.g., "Paris", "CDG")
- **Destination**: Type destination city or airport
- **Swap Button**: Click the ⇄ button to quickly swap origin and destination

#### Step 3: Pick Dates
- **Departure Date**: Select when you want to fly
- **Return Date**: Only shown for round-trip bookings
- **Date Limits**: Can search up to 365 days in advance

#### Step 4: Add Passengers
- **Adults**: 12+ years (minimum 1, maximum 9)
- **Children**: 2-11 years (maximum 9)
- **Infants**: Under 2 years (maximum 1 per adult)

#### Step 5: Search
- Click "Search Flights" to find available options
- Results typically appear in 2-3 seconds

---

### Understanding Results

#### Flight Card Information
Each flight card displays:
- **Airline**: Carrier name and code
- **Departure/Arrival Times**: Local airport times
- **Duration**: Total flight time
- **Stops**: "Non-stop" or number of stops with layover cities
- **Price**: Total cost for all passengers

#### Best Price Badge
A green "Best Price" badge highlights the cheapest flight option.

---

### Using the Price Chart

The interactive scatter plot helps you visualize flight options:

#### View Options
- **Time View**: Shows price trends throughout the day
  - X-axis: Departure time (00:00 - 23:59)
  - Y-axis: Price
  - Use this to find the cheapest time of day

- **Duration View**: Shows price vs flight duration
  - X-axis: Flight duration
  - Y-axis: Price
  - Use this to find the best value for your time

#### Color Coding
- 🟢 **Green**: Cheapest flight (best deal)
- 🔵 **Blue**: Standard flights
- 🟠 **Orange**: Flights with long layovers (>5 hours) or 2+ stops

#### Tooltips
Hover over any dot to see:
- Airline name
- Departure time
- Flight duration
- Price
- Stop information

---

### Filtering Results

#### Stops Filter
- **Any**: Show all flights
- **Direct only**: Non-stop flights only
- **1 stop or fewer**: Direct or one-stop flights
- **2+ stops**: Flights with multiple stops

#### Price Range
- Drag the slider to set minimum and maximum price
- Range automatically adjusts based on available flights
- Updates results in real-time

#### Airlines
- Check boxes to include specific airlines
- Shows flight count for each airline
- Search box appears if many airlines available

#### Departure Time
- **Morning**: 5:00 AM - 11:59 AM
- **Afternoon**: 12:00 PM - 5:59 PM
- **Evening**: 6:00 PM - 11:59 PM
- **Night**: 12:00 AM - 4:59 AM

#### Clear Filters
Click "Clear All" to reset all filters to default.

---

### Sorting Results

Available sort options:
- **Best**: Balanced ranking (price + duration)
- **Cheapest**: Lowest price first
- **Fastest**: Shortest duration first
- **Earliest**: Earliest departure time
- **Latest**: Latest departure time

---

### Round-Trip Selection

For round-trip searches:
1. Select your outbound flight
2. Return flight options will load automatically
3. Select your return flight
4. Both flights are displayed together

---

### Sharing Searches

Your search parameters are saved in the URL. You can:
- **Bookmark**: Save the search for later
- **Share**: Copy the URL to send to others
- **History**: Use browser back/forward navigation

---

### Troubleshooting

#### No Results Found
- Try different dates (±1-3 days)
- Check nearby airports
- Verify IATA codes are correct

#### Connection Error
- Check your Amadeus API credentials in `.env.local`
- Ensure you have internet connection
- Try clicking "Retry" button

#### Slow Loading
- Flight searches typically take 2-3 seconds
- Peak times may be slower due to API limits
- Try reducing search criteria

---

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS
- **Framer Motion 12** - Animation library
- **Material UI 7** - UI components

### State Management
- **Zustand 5** - Lightweight state management

### Data Visualization
- **Recharts 3** - Charting library

### Utilities
- **date-fns 4** - Date manipulation
- **Emotion** - CSS-in-JS styling

---

## 📁 Project Structure

```
flight-search-app/
├── app/
│   ├── actions/
│   │   ├── amadeus.ts          # Amadeus API integration
│   │   └── searchFlights.ts    # Flight search server action
│   ├── coming-soon/
│   │   └── page.tsx            # Placeholder pages
│   ├── results/
│   │   └── page.tsx            # Results page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/
│   ├── AirportInput.tsx        # Airport autocomplete
│   ├── AppInitializer.tsx      # App initialization
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── FilterSidebar.tsx       # Filter controls
│   ├── FlightCard.tsx          # Flight display card
│   ├── PassengerSelector.tsx   # Passenger counter
│   ├── PriceChart.tsx          # Price visualization
│   ├── SearchForm.tsx          # Search form
│   └── SelectedFlightSummary.tsx  # Selected flight summary
├── lib/
│   ├── amadeusTokenCache.ts    # API token caching
│   ├── constants.ts            # App constants
│   ├── logger.ts               # Logging utilities
│   ├── rateLimiter.ts          # API rate limiting
│   └── utils.ts                # Helper functions
├── store/
│   └── useFlightStore.ts       # Zustand state store
├── public/                     # Static assets
├── .env.local                  # Environment variables (create this)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── README.md
```

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# Amadeus API Credentials
AMADEUS_API_KEY=your_api_key_here
AMADEUS_API_SECRET=your_api_secret_here

# API Endpoints
AMADEUS_FLIGHT_OFFERS_URL=https://test.api.amadeus.com/v2/shopping/flight-offers
```

### Getting Amadeus API Credentials

1. Visit [developers.amadeus.com](https://developers.amadeus.com)
2. Create a free account
3. Navigate to "My Apps"
4. Create a new application
5. Copy your API Key and API Secret
6. Add them to your `.env.local` file

### API Limitations

- **Test Environment**: Limited to ~10 requests per second
- **Flight Search**: Up to 50 results per request
- **Date Range**: Maximum 365 days ahead
- **Passengers**: Maximum 9 total

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Code Style

The project follows strict styling rules:
- **Native Tailwind Utilities Only**: Use standard utility classes
- **No Custom Semantic Classes**: Avoid `bg-primary`, `btn-save`, etc.
- **Arbitrary Hex Values**: Use `bg-[#3B82F6]` for custom colors

### Key Components

#### SearchForm ([`components/SearchForm.tsx`](components/SearchForm.tsx))
Main search interface with trip type, airports, dates, and passengers.

#### FlightCard ([`components/FlightCard.tsx`](components/FlightCard.tsx))
Displays individual flight information with selection functionality.

#### PriceChart ([`components/PriceChart.tsx`](components/PriceChart.tsx))
Interactive scatter plot for price visualization.

#### FilterSidebar ([`components/FilterSidebar.tsx`](components/FilterSidebar.tsx))
Advanced filtering controls for results.

#### useFlightStore ([`store/useFlightStore.ts`](store/useFlightStore.ts))
Global state management using Zustand.

---

## 🔌 API Configuration

### Amadeus API Integration

The app uses the Amadeus Flight Offers API for flight data:

**Endpoint**: `GET /v2/shopping/flight-offers`

**Authentication**: OAuth 2.0 Bearer Token (cached server-side)

**Rate Limiting**: Implemented via [`lib/rateLimiter.ts`](lib/rateLimiter.ts)

### Server Actions

Flight search is handled by server actions in [`app/actions/searchFlights.ts`](app/actions/searchFlights.ts):

```typescript
// Example usage
const result = await searchFlights({
  origin: 'CDG',
  destination: 'JFK',
  departureDate: '2025-02-15',
  returnDate: '2025-02-22',
  adults: 2,
  children: 0,
  infants: 0
});
```

### Data Transformation

Amadeus API responses are transformed to our internal [`Flight`](store/useFlightStore.ts:20) type for consistency and type safety.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Style**: Follow existing patterns and TypeScript best practices
2. **Styling**: Use native Tailwind utilities only
3. **Components**: Keep components under 200 lines
4. **Testing**: Test responsive behavior on all breakpoints
5. **Documentation**: Update README for new features

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

This project is private and confidential.

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review the [PRD.md](PRD.md) for detailed specifications
- Check API status at [developers.amadeus.com](https://developers.amadeus.com)

---

**Built with ❤️ using Next.js, React, and TypeScript**
