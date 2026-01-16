Here is the **Final, Merged Product Requirements Document (PRD)**.

I have combined your uploaded PRD with the specific "Take Home" strategies we discussed (Next.js 16, Static Airport Data, and the strict Styling/Classname rules).

**Changes Applied:**

1. **Tech Stack:** Updated to **Next.js 16** (App Router).
2. **Styling Rules (Section 2.2):** Explicitly defined the "Native Tailwind Only" rule. You may use standard utilities (`bg-white`, `text-blue-500`) and arbitrary hex values (`bg-[#123456]`), but **NO** custom semantic class names (`bg-primary`, `btn-save`) are allowed.
3. **Architecture:** Reinforced the "Static Airport JSON" strategy to ensure zero-latency inputs.
4. **Styling:** Added "Native Tailwind Only" rule to enforce the use of Tailwind CSS classes only.
5. **ANIMATION** use framer-motion for all animations.
6. **STORAGE** use zustand for state management.
---

# Flight Search Engine - Final Master Plan (v3)

## 1. FEATURES (The "Product" View)

### 1.1 Search Interface

#### **Trip Type Selector**

* **Component**: Toggle switch or tab interface
* **Options**:
* One-Way (default)
* Round-Trip


* **Behavior**:
* When "Round-Trip" is selected, a "Return Date" input appears below the departure date.
* Return date must be >= departure date (validation enforced).
* API call will include both `departureDate` and `returnDate` parameters.



#### **Location Inputs (Origin & Destination)**

* **Smart Autocomplete**:
* As user types (minimum 2 characters), filter **static airport JSON**.
* Display format: "City Name (IATA Code) - Airport Name"
* Example: "Paris (CDG) - Charles de Gaulle"


* **Zero Latency**: No loading spinner; instant local filtering from static data (prevents API quota usage).
* Show top 5 matches.


* **Swap Button**:
* Icon button between origin/destination to reverse them.
* Keyboard shortcut support (nice touch).



#### **Date Picker**

* **Departure Date**: Always visible.
* **Return Date**: Only visible when "Round-Trip" is selected.
* **Min Date**: Today's date (disable past dates).
* **Max Date**: 1 year from today (Amadeus API limitation).
* **Mobile**: Use native date picker for better UX.

#### **Passenger Selector**

* **Dropdown Menu** with counter controls (+/- buttons).
* **Categories**:
* Adults (12+ years): Default 1, Max 9
* Children (2-11 years): Default 0, Max 9
* Infants (under 2): Default 0, Max number of adults (1 infant per adult)


* **Display**: Show total count in collapsed state ("2 Passengers").
* **API Impact**: Pass total count as `adults`, `children`, `infants` parameters.

#### **Search Trigger**

* **Primary Button**: "Search Flights".
* **Disabled State**: Button is disabled until minimum required fields are filled:
* Origin selected
* Destination selected
* Departure date selected
* (Return date selected if Round-Trip)


* **Loading State**: Button shows spinner and text changes to "Searching..." during API call.

---

### 1.2 Results Display System

#### **Loading State (During Initial Search)**

* **UI Elements**:
* Graph area: Show skeleton shimmer (rectangular placeholder).
* Flight list: Show 5 card skeletons with animated gradient.
* Filter sidebar: Disabled/grayed out.


* **Duration**: Typically 2-3 seconds for Amadeus API response.
* **No Data Shown**: Until API returns successfully.

#### **Error States**

* **Scenario 1: API Failure**
* Display: Centered empty state with icon (⚠️ or cloud with X).
* Message: "Unable to fetch flights. Please try again."
* Action: "Retry Search" button (re-triggers API call).


* **Scenario 2: No Results**
* Display: Friendly empty state with icon (✈️).
* Message: "No flights found for this route. Try adjusting your dates or destination."
* Action: Suggest nearby airports or alternative dates.


* **Scenario 3: Invalid Route**
* Display: Warning icon (⚠️).
* Message: "This route isn't available. Please try a different destination."



#### **Success State (When Data Loads)**

* **Header Section**:
* Show search summary: "Paris (CDG) → New York (JFK) • Feb 15, 2025 • 2 Adults".
* Display result count: "Found 47 flights".
* Show "Modify Search" button (collapses back to search form).



---

1.3 Live Price Visualization (The Star Feature)
Primary Graph: Interactive Scatter Plot
Chart Type: Scatter Plot (Recharts).

Goal: To satisfy both "Price Trends" (Time) and "Efficiency" (Duration) requirements using a single dynamic component.

Control: "View By" Toggle
Component: Segmented Control or Toggle Button [ Time | Duration ].

Default State: "Time" (Shows the Price Trend).

View A: Intra-Day Price Trend (Default)
X-Axis: Departure Time (00:00 to 23:59).

Why: Visualizes the "Trend" of the day. Users can instantly see if flying in the morning is more expensive than the evening.

Y-Axis: Price (USD).

Insight: "The visual 'shape' of the dots reveals the price floor fluctuation throughout the day."

View B: Duration vs. Price (Efficiency)
X-Axis: Duration (e.g., 3h, 8h, 15h).

Y-Axis: Price (USD).

Insight: "Visualizes the cost of convenience. Shows if paying $50 more saves 4 hours."

Data Points (Dots)
Visual Design:

Green Dot (fill-[#10B981]): The absolute cheapest flight (Best Deal).

Blue Dot (fill-[#3B82F6]): Standard flights.

Orange Dot (fill-[#F97316]): Flights with long layovers (>5h) or 2+ stops.

Size: 10px (mobile-friendly tap target).

Interactive Tooltip (Crucial)
Since one variable is always hidden from the axes, the tooltip must bridge the gap.

Header: Airline Logo + Name.

Row 1: Departure: 14:30 (Bold).

Row 2: Duration: 7h 20m.

Row 3: Price: $450.

Footer: "Non-stop" or "1 stop (LHR)".

Responsive Behavior
Mobile: Hide the "View By" toggle if space is tight and default to "Time" (Trend view).

Height: 350px (Desktop), 250px (Mobile).

Empty State: If filters remove all flights, show a "No flights in this range" message over the empty grid.
---

### 1.4 Complex Filtering System

#### **Filter Sidebar (Desktop) / Drawer (Mobile)**

##### **Architecture**:

* **Desktop**: Fixed sidebar on left (280px width).
* **Mobile**: Floating action button ("Filters") opens bottom drawer/modal.

##### **Filter Categories**:

**1. Stops (Radio Group or Checkboxes)**

* **Options**:
* Any (default, shows all)
* Direct only
* 1 stop or fewer
* 2+ stops


* **Visual**: Each option shows count in parentheses.
* Example: "Direct (12)" ← 12 direct flights available.


* **Behavior**:
* Multi-select OR exclusive (your choice, checkboxes feel more flexible).
* Instant update (no "Apply" button).



**2. Price Range (Dual-Handle Slider)**

* **Range**: Auto-calculated from results.
* Min: Cheapest flight price (rounded down to nearest $10).
* Max: Most expensive flight price (rounded up to nearest $10).


* **Display**: Show current range above slider.
* Example: "$200 - $800".


* **Optimization**:
* Debounced by 150ms to avoid excessive re-renders while dragging.
* Only update Zustand store after user releases the handle.



**3. Airlines (Checkbox List)**

* **Dynamic Generation**:
* Extract unique airlines from fetched results.
* Example: If results have United, Delta, American → show 3 checkboxes.


* **Sorting**: Alphabetical order.
* **Count Display**: Show number of flights per airline.
* Example: "☐ United Airlines (18)".


* **Search Box** (If >6 airlines):
* Add a mini search input to filter the airline list.
* Helps when route has 15+ airline options.


* **Behavior**: Multi-select, instant update.

**4. Departure Time (Optional, but impressive)**

* **Categories**:
* Morning (5am - 11:59am)
* Afternoon (12pm - 5:59pm)
* Evening (6pm - 11:59pm)
* Night (12am - 4:59am)


* **Visual**: Icon + label + count.
* **Multi-select**: User can choose multiple time windows.

**5. Return Time (Only for Round-Trip)**

* Same structure as Departure Time.
* Only appears when trip type is "Round-Trip".

##### **Filter Controls**:

* **Clear All Button**:
* Positioned at top of filters.
* Resets all filters to default state.
* Shows count of active filters: "Clear All (3)".


* **Active Filter Chips** (Desktop):
* Show selected filters as dismissible chips above the results.
* Example: "Direct ✕ | $200-$500 ✕ | Delta ✕".
* Clicking ✕ removes that filter.



---

### 1.5 Flight Results List

#### **Sort Controls (Above the List)**

* **Dropdown Menu**: "Sort by:"
* **Best** (default): Amadeus's ranking (considers price + duration + stops).
* **Cheapest**: Price ascending.
* **Fastest**: Duration ascending.
* **Earliest Departure**: Departure time ascending.
* **Latest Departure**: Departure time descending.



#### **Flight Card Design**

Each card shows:

**Top Row**:

* Airline logo (left) + Airline name.
* Price (right, bold, large font).

**Middle Row (Outbound)**:

* Departure: "10:30 AM CDG".
* Duration bar with stops indicator: "8h 25m" with visual timeline.
* Arrival: "2:55 PM JFK".
* If stops > 0: Show layover city/cities below ("1 stop in London").

**Bottom Row (Round-Trip Only)**:

* Same layout for return flight.

**Footer**:

* Baggage info: "1 carry-on, 1 checked bag included".
* "Select" button (primary CTA).

**States**:

* **Hover**: Slight elevation shadow + border highlight.
* **Selected**: If user clicks, highlight with accent color border (for future booking flow).

#### **Empty Filtered State**:

* When filters exclude all flights:
* Show empty state icon.
* Message: "No flights match your filters. Try adjusting your criteria."
* Button: "Reset Filters".



---

### 1.6 Responsive Layout Strategy

#### **Desktop (≥1024px)**

```
┌─────────────────────────────────────────┐
│ Search Bar (Collapsible after search)  │
├──────────┬──────────────────────────────┤
│ Filters  │ Results Header               │
│ Sidebar  │ (47 flights, Sort dropdown)  │
│ (280px)  ├──────────────────────────────┤
│          │ Price Graph (Scatter)        │
│ Stops    │ (Full width, 400px height)   │
│ Price    ├──────────────────────────────┤
│ Airlines │ Date Flexibility Graph       │
│ Times    │ (Optional, 200px height)     │
│          ├──────────────────────────────┤
│          │ Flight Card 1                │
│          │ Flight Card 2                │
│          │ Flight Card 3                │
│          │ ...                          │
└──────────┴──────────────────────────────┘

```

#### **Tablet (768-1023px)**

```
┌─────────────────────────────────────────┐
│ Search Bar                              │
├─────────────────────────────────────────┤
│ [Filters Button] [Sort Dropdown]        │
├─────────────────────────────────────────┤
│ Price Graph (350px height)              │
├─────────────────────────────────────────┤
│ Flight Card 1                           │
│ Flight Card 2                           │
│ ...                                     │
└─────────────────────────────────────────┘

```

* Filters open in a slide-in drawer from left.

#### **Mobile (<768px)**

```
┌─────────────────────┐
│ Search Bar          │
│ (Collapsed state)   │
├─────────────────────┤
│ 47 Flights          │
│ [Filters] [Sort]    │
├─────────────────────┤
│ Graph (Optional)    │
│ Or "View Graph"     │
├─────────────────────┤
│ Flight Card 1       │
│ (Compact layout)    │
│ Flight Card 2       │
│ ...                 │
└─────────────────────┘

```

* Filters open in a bottom sheet (drawer from bottom).
* Cards are more compact (smaller fonts, tighter spacing).

---

## 2. TECHNICAL STACK (The "Engineering" View)

### 2.1 Core Technologies

#### **Framework & Language**

* **Next.js 16** (App Router)
* Why: Leverages React 19 primitives, Server Actions for secure API calls, and built-in optimizations.


* **TypeScript**
* Why: Type safety for complex API responses.


* **Tailwind CSS**
* Why: Rapid styling, responsive utilities, theming support.



#### **State Management**

* **Zustand**
* Why: Lightweight, no boilerplate, perfect for syncing filters ↔ graph ↔ list.



**Store Structure**:

```
FlightStore:
├── searchParams (origin, destination, dates, passengers)
├── rawFlights[] (unfiltered results from API)
├── filteredFlights[] (post-filter results)
├── filters {stops, priceRange, airlines, times}
├── isLoading (boolean)
├── error (string | null)
├── dateFlexibilityData[] (for bar chart)
└── actions {
    setSearchParams(),
    setFlights(),
    applyFilters(),
    resetFilters(),
    setSortOption()
}

```

#### **Data Visualization**

* **Recharts**
* Components: `<ScatterChart>`, `<BarChart>`
* Why: React-native, TypeScript support, easier than D3 for time constraints.
* Customization: Use `<Cell>` for conditional coloring.



#### **UI Components**

* **shadcn/ui** (Optional but recommended)
* Components: Button, Dropdown, Slider, Checkbox, RadioGroup, Drawer.
* Why: Pre-built, accessible, customizable with Tailwind.


* **Lucide React** (Icons)
* Icons: Plane, Calendar, User, Filter, X, etc.



#### **Date Handling**

* **date-fns**
* Why: Lightweight, tree-shakeable.
* Use cases: Date formatting, validation, range calculations.



---

### 2.2 ⚠️ STRICT STYLING RULES (Crucial)

To demonstrate precise control over the design system without relying on library presets or theme configurations:

1. **Native Tailwind Utilities ONLY:** You may use standard Tailwind utility classes for layout, spacing, and typography (e.g., `flex`, `p-4`, `mt-2`, `items-center`).
* *Permitted:* `bg-white`, `text-blue-500`, `border-gray-200` (Native colors are okay).


2. **NO Custom Semantic Classes:** Do **NOT** create or use semantic class names in your HTML or CSS.
* *Prohibited:* `bg-primary`, `text-secondary`, `btn-save`, `card-wrapper`, `bg-base-100`.


3. **Arbitrary Hex Values for Custom Colors:** If the design requires a specific color that isn't a native Tailwind shade, you MUST use Tailwind's arbitrary value syntax.
* *Required:* `bg-[#1E293B]`, `text-[#0F172A]`, `border-[#E2E8F0]`.
* *Goal:* This proves you can execute a specific design spec (like a Figma file) without needing a theme configuration file.



---

### 2.3 Data Strategy

#### **Airports Data (Static)**

* **Source**: Manual JSON file (`/data/airports.ts`) containing Top 100-150 global airports.
* **Structure**:

```json
[
  {
    "iataCode": "CDG",
    "city": "Paris",
    "name": "Charles de Gaulle Airport",
    "country": "France"
  },
  ...
]

```

* **Why**: Eliminates API quota usage for autocomplete, guarantees 0ms latency, and reduces risk of rate limiting.
* **Filtering Logic**:
* Match against: `city`, `iataCode`, `name`.
* Case-insensitive.
* Rank exact matches higher (e.g., "PAR" → Paris before Paramaribo).



#### **Flights Data (Amadeus API)**

**Endpoint**: `GET /v2/shopping/flight-offers`

**Authentication Flow**:

1. **Token Acquisition** (Server-side):
* Endpoint: `POST /v1/security/oauth2/token`
* Credentials: API Key + API Secret (stored in `.env.local`).
* Response: Access token (valid for 30 minutes).
* **Caching Strategy**: Store token + expiry in memory (global variable) to avoid repeated auth calls.


2. **Flight Search** (Server-side):
* Include token in `Authorization: Bearer {token}` header.
* Pass user's search parameters.



**Server Action** (`/app/actions/searchFlights.ts`):

```
Input: {
  originLocationCode: "CDG",
  destinationLocationCode: "JFK",
  departureDate: "2025-02-15",
  returnDate?: "2025-02-22", // Optional
  adults: 2,
  children: 0,
  infants: 0
}

Process:
1. Validate inputs (dates, IATA codes).
2. Check cached token (if expired, fetch new).
3. Call Amadeus API.
4. Transform response (extract relevant fields).
5. Return to client.

Output: {
  flights: [...],
  error: null
} OR {
  flights: [],
  error: "Error message"
}

```

**Response Transformation**:

* Raw Amadeus response is verbose (100+ fields per flight).
* Extract only needed fields:
* `id`, `price.total`, `itineraries[].duration`, `itineraries[].segments[]` (airline, departure, arrival, stops).


* Store in Zustand as clean TypeScript type.

**Rate Limiting**:

* Amadeus Test API: ~10 requests/second.
* **Safety**: Add 200ms delay between background calls for date flexibility graph.

---

### 2.4 Filtering Logic (The Brain)

#### **How Filters Work**:

**Step 1: User Changes Filter**

* Example: User drags price slider to $200-$600.
* UI triggers: `applyFilters({priceRange: [200, 600]})`.

**Step 2: Zustand Action Executes**

```
applyFilters() {
  1. Read current filter state: {stops, priceRange, airlines, times}
  2. Start with rawFlights[] (the unfiltered master list)
  3. Apply each filter sequentially:
     - Filter by stops (if not "Any")
     - Filter by price range
     - Filter by selected airlines
     - Filter by departure times
  4. Save result to filteredFlights[]
  5. Trigger React re-render
}

```

**Step 3: UI Auto-Updates**

* Graph component reads `filteredFlights` from store → Recharts re-renders.
* List component reads `filteredFlights` from store → Cards re-render.
* Filter sidebar updates counts (e.g., "Direct (12)" → "Direct (5)").

**Optimization**:

* **Debouncing**: Only for slider (150ms delay).
* **Memoization**: Use `useMemo` to avoid recalculating filtered list if filters haven't changed.
* **Virtual Scrolling** (Optional): If >100 flight cards, use `react-window` to render only visible cards.

---

### 2.5 URL Persistence

#### **Why It Matters**:

* User can bookmark searches.
* Share links with friends.
* Browser back/forward works correctly.

#### **Implementation**:

**Writing to URL**:

```
User clicks "Search Flights"
  ↓
Server Action returns flights
  ↓
Update Zustand store
  ↓
Update URL: /results?from=CDG&to=JFK&date=2025-02-15&adults=2

```

**Reading from URL** (On Page Load):

```
User visits: /results?from=CDG&to=JFK&date=2025-02-15
  ↓
Next.js extracts searchParams
  ↓
Hydrate Zustand store with these values
  ↓
Auto-trigger search (call Server Action)
  ↓
Display results

```

**Libraries**:

* Next.js built-in: `useSearchParams()`, `useRouter().push()`.
* Encode complex params with `URLSearchParams`.

---

## 3. USER & DATA FLOW (End-to-End Journey)

### 3.1 Application Initialization

**User Action**: Opens `https://yourapp.com`

**System**:

1. Next.js renders home page.
2. Zustand initializes:
* Load `airports.json` into store.
* Set default values (1 adult, one-way, today's date).


3. Search form is ready (0ms wait).

**UI**:

* Search inputs are interactive.
* No loading spinners.
* Autofocus on "Origin" input.

---

### 3.2 Search Configuration

**User Action**: Fills out form

1. Types "Par" in Origin → Selects "Paris (CDG)".
2. Types "New" in Destination → Selects "New York (JFK)".
3. Picks date: Feb 15, 2025.
4. Selects "Round-Trip" → Return date picker appears.
5. Picks return: Feb 22, 2025.
6. Opens passenger dropdown → Sets 2 adults.

**System** (Client-side only):

* Zustand stores each change in `searchParams` state.
* No API calls yet (saves quota).
* "Search Flights" button becomes enabled.

---

### 3.3 Flight Search Execution

**User Action**: Clicks "Search Flights"

**System (Client)**:

1. Set `isLoading: true` (triggers loading UI).
2. Call Server Action: `searchFlights(searchParams)`.

**System (Server)**:

1. Validate inputs:
* IATA codes exist.
* Dates are valid (not in past, return > departure).


2. Check Amadeus token cache:
* If expired: Call OAuth endpoint, cache new token.


3. Build API request:
```
GET /v2/shopping/flight-offers?
  originLocationCode=CDG&
  destinationLocationCode=JFK&
  departureDate=2025-02-15&
  returnDate=2025-02-22&
  adults=2&
  max=50

```


4. Parse response:
* Extract flight offers.
* Transform to clean format.


5. Return to client:
```json
{
  "flights": [...47 flights...],
  "error": null
}

```



**System (Client)**:

1. Receive data.
2. Update Zustand:
* `rawFlights = response.flights`
* `filteredFlights = response.flights` (no filters yet)
* `isLoading = false`


3. Calculate metadata:
* Min price (for green dot).
* Price range (for slider bounds).
* Unique airlines (for filter checkboxes).


4. Update URL: `/results?from=CDG&to=JFK&date=2025-02-15&return=2025-02-22&adults=2`

**UI**:

* Loading skeletons disappear.
* Graph renders with 47 data points.
* Flight list shows 47 cards.
* Filters sidebar shows counts ("Direct (12)", "Delta (8)", etc.).

---

### 3.4 Background: Date Flexibility Graph

**System** (Automatically after main search):

1. Identify date range: ±3 days (Feb 12-18).
2. Make 6 parallel API calls (exclude already-searched Feb 15):
```
Promise.all([
  searchFlights({...params, departureDate: '2025-02-12'}),
  searchFlights({...params, departureDate: '2025-02-13'}),
  ... // 4 more
])

```


3. Add 200ms delay between calls (rate limit safety).
4. As each response arrives:
* Extract cheapest price for that date.
* Update `dateFlexibilityData[]` in store.
* Bar chart progressively fills in.



**UI**:

* Bar chart appears below scatter plot.
* Initially shows 1 filled bar (Feb 15).
* Other 6 bars fill in over ~3 seconds.
* Skeleton bars show while loading.

---

### 3.5 Interactive Filtering

**User Action**: Drags price slider from $200-$1000 down to $200-$600

**System**:

1. Slider component has `onChange` → debounced by 150ms.
2. After user stops dragging:
* Call `applyFilters({priceRange: [200, 600]})`.


3. Zustand action runs:
```
filteredFlights = rawFlights.filter(flight => {
  const price = flight.price;
  return price >= 200 && price <= 600;
})

```


4. Result: 47 flights → 23 flights.

**UI** (All update simultaneously):

* **Graph**:
* 24 dots smoothly animate out.
* 23 dots remain.
* Green "best deal" dot recalculates (might change).


* **Flight List**:
* 24 cards fade out.
* Layout shifts to show 23 cards.


* **Filter Sidebar**:
* Counts update: "Direct (12)" → "Direct (7)".
* "Clear All (1)" badge appears.



**User Action**: Clicks "Delta" checkbox

**System**:

1. Call `applyFilters({airlines: ['Delta']})`.
2. Zustand applies BOTH filters:
```
filteredFlights = rawFlights.filter(flight => {
  return (flight.price >= 200 && flight.price <= 600) &&
         (flight.airline === 'Delta');
})

```


3. Result: 23 flights → 8 flights.

**UI**:

* Graph shows 8 dots.
* List shows 8 cards.
* Active filter chips: "Delta ✕ | $200-$600 ✕".

---

### 3.6 Sorting

**User Action**: Changes sort to "Fastest"

**System**:

1. Call `setSortOption('fastest')`.
2. Zustand sorts `filteredFlights`:
```
filteredFlights.sort((a, b) => a.duration - b.duration)

```


3. **Graph unchanged** (dots stay in same positions).
4. **List re-orders** (shortest duration flights now on top).

**UI**:

* Cards smoothly rearrange (CSS transition).

---

### 3.7 Date Change via Flexibility Graph

**User Action**: Clicks on "Feb 14" bar in date flexibility graph

**System**:

1. Update `searchParams.departureDate = '2025-02-14'`.
2. Check if Feb 14 data is cached:
* **Yes**: Use cached flights.
* **No**: Make new API call.


3. Update `rawFlights` and `filteredFlights`.
4. Re-apply current filters.
5. Update URL: `?from=CDG&to=JFK&date=2025-02-14&...`.

**UI**:

* Graph shows different data points (new prices/durations).
* Flight list shows new flights.
* Date picker updates to show Feb 14.
* Bar chart highlights new date.

---

### 3.8 Error Scenarios

**Scenario A: API Returns Error**

* **Trigger**: Amadeus API is down or rate-limited.
* **System**:
* Server Action returns `{flights: [], error: "Service unavailable"}`.
* Zustand sets `error` state.


* **UI**:
* Shows error state with retry button.
* Graph/list hidden.



**Scenario B: No Flights Found**

* **Trigger**: User searches obscure route (e.g., small island to small island).
* **System**:
* API returns empty array but no error.
* Zustand sets `filteredFlights = []`.


* **UI**:
* Shows friendly empty state.
* "Try different dates or destinations".



**Scenario C: All Flights Filtered Out**

* **Trigger**: User sets filters that exclude everything (e.g., price <$100 but cheapest is $400).
* **System**:
* `applyFilters()` results in `filteredFlights = []`.


* **UI**:
* Shows "No flights match filters" message.
* "Reset Filters" button.



---

## 4. MOBILE-SPECIFIC OPTIMIZATIONS

### 4.1 Touch Interactions

**Graph**:

* Increase dot size to 10px (easier to tap).
* Tooltip triggered by tap, dismissed by tap outside.
* Pinch-to-zoom disabled (keeps UI simple).

**Filters**:

* Bottom drawer slides up smoothly (300ms animation).
* Drawer has handle/drag indicator at top.
* "Apply Filters" button at bottom of drawer (optional, or auto-apply).

**Cards**:

* Full-width tappable area.
* Swipe gestures disabled (avoid conflicts).

### 4.2 Performance

**Image Optimization**:

* Airline logos: Use WebP format, lazy load.
* Next.js `<Image>` component with `loading="lazy"`.

**Code Splitting**:

* Graph component: Dynamically import Recharts.
```
const ScatterChart = dynamic(() => import('recharts').then(mod => mod.ScatterChart))

```


* Loads only when results appear.

**Reduced Motion**:

* Respect `prefers-reduced-motion` media query.
* Disable graph animations for users with motion sensitivity.

---

## 5. POLISH & "WOW" FACTORS

### 5.1 Micro-Interactions

**Search Button**:

* Ripple effect on click (Tailwind: `active:scale-95`).
* Loading spinner inside button (not separate overlay).

**Filter Chips**:

* Slide in from left when applied.
* Bounce animation when clicked to remove.

**Graph Transitions**:

* Dots fade in on mount (staggered, 50ms delay each).
* Smooth color change when recalculating "best deal".

### 5.2 Accessibility

**Keyboard Navigation**:

* Tab order: Search inputs → Filters → Sort → Flight cards.
* Enter key on card triggers selection.

**Screen Reader**:

* Aria-labels on all interactive elements.
* Announce filter changes: "23 flights found".
* Graph has text summary: "Price ranges from $200 to $1000".

**Color Contrast**:

* All text meets WCAG AA standards (4.5:1 ratio).
* Graph dots have stroke/border for visibility.

### 5.3 Loading States That Don't Feel Slow

**Skeleton Screens**:

* Match exact layout of real content.
* Subtle shimmer animation (not aggressive pulse).

**Progressive Loading**:

* Show graph as soon as data arrives (don't wait for date flexibility).
* Show first 10 cards, then lazy-load rest.

**Optimistic UI**:

* When user changes sort, re-order instantly (no wait).
* When user clicks filter, update count immediately.

---

## 6. TESTING CHECKLIST (Before Submission)

### 6.1 Functional Tests

* [ ] One-way search works.
* [ ] Round-trip search works.
* [ ] Passenger count affects results (price changes).
* [ ] All filter combinations work together.
* [ ] Sort options change order correctly.
* [ ] Date flexibility graph updates correctly.
* [ ] Clicking date bar changes main search.
* [ ] Clear filters resets everything.
* [ ] Error states display correctly.
* [ ] No results state displays correctly.
* [ ] URL updates on search.
* [ ] URL can be bookmarked and reopened.

### 6.2 Responsive Tests

* [ ] Desktop (1440px): All elements visible, sidebar fixed.
* [ ] Laptop (1024px): Layout intact, no horizontal scroll.
* [ ] Tablet (768px): Filters in drawer, graph resizes.
* [ ] Mobile (375px): Cards stack, all text readable.
* [ ] Mobile landscape: Graph doesn't break.

### 6.3 Performance Tests

* [ ] Initial page load <2 seconds.
* [ ] Search results appear <3 seconds.
* [ ] Filter changes feel instant (<100ms).
* [ ] Graph animations are smooth (60fps).
* [ ] No console errors.
* [ ] No API key exposed in browser.

### 6.4 Edge Cases

* [ ] Same origin/destination (should show error or autocomplete prevents).
* [ ] Return date before departure (validation prevents).
* [ ] 9 adults + 9 children (max passengers).
* [ ] Cheapest flight is also longest duration (green dot position).
* [ ] Only 1 flight in results (graph still works).
* [ ] 200+ flights in results (list scrolls, no lag).

---

## 7. "HIRE ME" JUSTIFICATION (Why This Plan Wins)

### 7.1 Product Thinking

* **User-Centric**: Date flexibility graph solves real pain point (finding cheaper dates).
* **Information Hierarchy**: Price graph is prominent (users' #1 concern).
* **Progressive Disclosure**: Filters don't overwhelm, they're organized and collapsible.

### 7.2 Engineering Maturity

* **Risk Mitigation**: Static airports eliminate API quota death spiral.
* **Performance**: Debouncing, memoization, lazy loading show you understand scale.
* **Type Safety**: TypeScript prevents runtime errors.
* **Security**: API keys hidden via Server Actions.

### 7.3 Attention to Detail

* **Accessibility**: Keyboard nav, screen readers, color contrast.
* **Error Handling**: Every failure mode has a graceful UI.
* **Responsive**: Not just "mobile-friendly" but mobile-optimized.

### 7.4 Going Beyond Requirements

* **Date Flexibility Graph**: Not required, but shows initiative.
* **URL Persistence**: Not required, but critical for real product.
* **Sort Options**: Not required, but obvious user need.
* **Loading States**: Not required, but professional standard.

---

## 8. IMPLEMENTATION TIMELINE (16 Hours)

**Hours 1-3: Setup & Core Search**

* Next.js 16 + Tailwind + Zustand setup.
* Static airport autocomplete implementation.
* Search form with validation.
* Server Action for Amadeus API.

**Hours 4-6: Results Display**

* Flight card component.
* Basic list rendering.
* Loading/error states.

**Hours 7-9: Graph Implementation**

* Scatter plot with Recharts.
* Color logic (green/blue/orange).
* Interactive tooltips.
* Responsive sizing.

**Hours 10-12: Filtering System**

* Sidebar/drawer UI.
* Zustand filter logic (Instant updates).
* Real-time updates (graph + list sync).
* Clear filters functionality.

**Hours 13-14: Polish**

* Date flexibility bar chart.
* Sort dropdown.
* URL persistence.
* Mobile drawer.

**Hours 15-16: Testing & Refinement**

* Responsive testing (all breakpoints).
* Accessibility audit.
* Performance optimization.
* Edge case fixes.

---

## 9. FINAL DELIVERY CHECKLIST

**Code Quality**:

* [ ] TypeScript with no `any` types.
* [ ] Components under 200 lines.
* [ ] Consistent naming conventions.
* [ ] Comments on complex logic.

**Documentation**:

* [ ] README with setup instructions.
* [ ] Environment variables documented.
* [ ] API limitations explained.
* [ ] Screenshots of desktop + mobile.

**Demo Readiness**:

* [ ] Deployed to Vercel.
* [ ] Test searches work reliably.
* [ ] No placeholder content ("Lorem ipsum").
* [ ] Fast initial load (<3s).