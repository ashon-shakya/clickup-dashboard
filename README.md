# ClickUp Task Dashboard

A modern React app that lists ClickUp tasks by workspace and assignee. Features include:

- Workspace dropdown to select which workspace to view
- Dynamic task list with **filtering by assignees**
- Assignee badges with **unique colors and user icons**
- “No Assignee” option for unassigned tasks
- Modern **bluish-black dashboard UI**
- Token stored in **localStorage** for convenience
- Logout and token management

---

## Demo Screenshot

![Screenshot](screenshot.png)  
_(Optional: add your own screenshot here)_

---

## Features

- Workspace selection via dropdown
- Assignee filter checkboxes with colored icons
- Tasks displayed as cards with status icons
- Tasks filtered dynamically based on selected assignees
- Responsive grid layout
- Persistent API token in localStorage
- Logout button clears token and resets state

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/clickup-dashboard.git
cd clickup-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Tailwind CSS (if not already)

```bash
npm install tailwindcss @tailwindcss/vite

```

`index.css`

```bash
@import "tailwindcss";

```

`vite.config.js`

```bash
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 4. Get ClickUp API Token

- Go to ClickUp Settings → Apps → API Token
- Copy your Personal API Token
- Open the app in the browser and paste the token when prompted

The token will be stored in `localStorage` for future visits.

### 5. Run the app

```bash
npm start
```

Open http://localhost:5173 to see the dashboard.

## 6. Usage

- Enter your **ClickUp API token** (or use the stored one)
- Select a **workspace** from the dropdown
- Check one or more **assignees** to filter tasks
- Tasks are displayed as cards with:
  - Task name
  - Status icon
  - Assignee badges (colored user icons)
- Click **Logout** to clear your token and start over

---

## 7. Tech Stack

- React + JSX
- Axios for API requests
- TailwindCSS for styling
- Lucide React icons for status and user icons

---

## 8. Folder Structure

```bash
clickup-dashboard/
├── src/
│ ├── App.jsx # Main app
│ ├── index.js # React entry point
│ └── index.css # Tailwind styles
├── package.json
└── README.md
```

---

## Notes

- Make sure your ClickUp token has access to all the workspaces you want to view
- Tasks are fetched per workspace; assignee filtering is client-side
- Task statuses are mapped to icons (done, in progress, blocked, etc.)

---

This README is ready to use — just replace `yourusername` in the clone URL and optionally add a real screenshot.
