# Trade Republic Analysis Tool

A modern web application built with Next.js and TypeScript for analyzing Trade Republic customer service data. The application processes and analyzes CSV files containing customer data, tickets, and complaints to generate insights about customer service performance.

🚀 [Live Demo](https://analytics-teal.vercel.app/)

## Features

- 📊 Real-time data analysis
- 🎯 Interactive file upload interface
- 💻 Terminal-like logging system
- 📈 Beautiful results visualization
- 🌙 Dark mode support
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast and responsive

## Tech Stack

- Next.js 15.1.6
- TypeScript
- Tailwind CSS
- Papa Parse (CSV parsing)
- Lodash
- Radix UI Components

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/trade-republic-analysis.git
cd trade-republic-analysis
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload your CSV files:
   - Personal data file (containing customer information)
   - Tickets data file (containing support ticket information)
   - Complaints data file (containing customer complaints)

2. Click "Run Analysis" to process the data

3. Watch the analysis progress in the terminal display

4. View the results in the beautiful results dashboard

## CSV File Requirements

### Personal Data CSV
- Required columns:
  - `AUTH_ACCOUNT_ID`: Unique identifier for each customer
  - `JURISDICTION`: Customer's jurisdiction (e.g., 'DE', 'FR')

### Tickets Data CSV
- Required columns:
  - `AUTH_ACCOUNT_ID`: Customer identifier
  - `CREATED_AT`: Ticket creation timestamp
  - `SOLVED_AT`: Ticket resolution timestamp
  - `STATUS`: Ticket status
  - `CONTACT_REASON_VALUE`: Reason for contact

### Complaints Data CSV
- Required columns:
  - `AUTH_ACCOUNT_ID`: Customer identifier
  - `CREATED_AT`: Complaint creation timestamp
  - `SOLVED_AT`: Complaint resolution timestamp

## Analysis Metrics

The tool analyzes three key metrics:
1. Average Time to Solution (TTS) for German customers in August
2. Percentage of interest-related complaints resolved within SLA
3. Number of French customers with transfer-related complaints

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

The application is deployed on Vercel and can be accessed at [https://analytics-teal.vercel.app/](https://analytics-teal.vercel.app/)
