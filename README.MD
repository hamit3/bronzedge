# Bronzedge - Industrial IoT Dashboard

Bronzedge is a modern Industrial IoT management dashboard built with Refine, Ant Design, and Supabase.

## ✨ Features

- **Refine Framework:** Powerful CRUD and data management.
- **Ant Design UI:** Clean, industrial design with custom dark theme.
- **Supabase Backend:** Backend-as-a-service for database and authentication.
- **Custom Aesthetic:** Premium dark mode with animated circuit backgrounds.

## 🛠 Tech Stack

- [Refine](https://refine.dev/)
- [Ant Design](https://ant.design/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the project or navigate to the directory.
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file (copy from `.env.example`).
   - Add your Supabase URL and Anon Key.
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the Project

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the result.

## 📂 Project Structure

```
src/
  pages/
    login/         # Custom dark theme login page
    dashboard/     # IoT dashboard landing
  components/      # Reusable UI components
  providers/       # Authentication and data providers
  utils/           # Helper functions and utilities
```

## 🎨 Theme Configuration

The application uses a custom Ant Design theme with:
- **Primary Color:** `#f88601` (Bronzedge Orange)
- **Background:** `#0a0f1e` (Deep Space Dark)
- **Algorithm:** Dark Algorithm

---
Built with ❤️ for industrial excellence.
