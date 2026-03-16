# FlowSheet Electron Wrapper

This is a **separate folder** that wraps the existing Next.js app in Electron.
It does **NOT** modify any files in `engineering-notebook`.

## Structure

```
flowsheet-electron/     <- You are here (NEW)
engineering-notebook/   <- Your original app (UNCHANGED)
```

## How it works

1. This Electron app simply opens a window
2. It loads `http://localhost:3000` (your Next.js dev server)
3. Your original app runs exactly as before

## To run

1. First, start your Next.js app (in a separate terminal):
   ```
   cd ../engineering-notebook
   npm run dev
   ```

2. Then, start Electron:
   ```
   npm install
   npm start
   ```

Or use the combined command:
```
npm run dev
```

## Future: Python Bridge

Once this works, we'll add:
- Python process spawning
- FreeCAD integration
- Native file system access

## Safety

Your original `engineering-notebook` folder is completely untouched.
You can delete this entire `flowsheet-electron` folder at any time
and your original app will still work perfectly.
