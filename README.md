# FlowSheet

**FlowSheet** is an open-source Integrated Engineering Design Environment that blends mathematical formulas, rich-text documentation, Python scripting, and generative 3D CAD modeling into a single, infinite spatial canvas.

## Features
- **Spatial Interface:** An infinite canvas for non-linear, flexible engineering work.
- **Dependency Flow:** Variables assigned in one block can be natively accessed in others.
- **Python Integration:** Run standard Python environments locally in `Script` blocks.
- **Parametric CAD:** Generate and view real-time 3D geometry using the `CAD` block with ForgeCAD.
- **Document Rendering:** Incorporate PDF standards and Image references seamlessly into your workspace.

## Repository Structure
This repository is organized as a monorepo containing:
- `/frontend` - The Next.js React application (Browser UI)
- `/desktop` - The Electron wrapper and Python bridge for desktop execution

## Quick Start (Development)
To run FlowSheet on your local machine:

1. **Install Dependencies**
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm install

   # Terminal 2 - Desktop
   cd desktop
   npm install
   ```

2. **Start the App**
   FlowSheet's Electron wrapper will automatically start the Next.js development server for you. You only need to run:
   ```bash
   cd desktop
   npm start
   ```
   *(Wait a few seconds for the Next.js compiler to finish, and the interface will load automatically.)*

## Creating a Portable Executable (Windows)
FlowSheet uses a customized `standalone` Next.js server to ensure lightning-fast startup times without needing `npx` or large `node_modules`.

1. **Build the optimized Frontend first:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Package the Desktop app:**
   ```bash
   cd desktop
   npm run build
   ```
   
The standalone `.exe` will be available in `desktop/dist/win-unpacked`.

## License
MIT License. See `LICENSE` for details.
