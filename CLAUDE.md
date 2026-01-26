# MulmoCast App Architecture Guide

This document provides a high-level overview of the MulmoCast application architecture to help future Claude instances understand and be productive with this codebase.

## Overview

MulmoCast is an Electron + Vue.js application for creating multimedia presentations using the MulmoCast framework. It provides a visual editor for creating presentation "beats" (slides) with AI-generated content including images, audio, and video. The app features a modern UI built with Tailwind CSS v4, Radix Vue components, and supports internationalization.

## Key Architecture Components

### 1. Electron Architecture

The application follows Electron's multi-process architecture:

- **Main Process** (`src/main/`)
  - Entry point: `main.ts`
  - Handles IPC communication with renderer
  - Manages project files and settings
  - Interfaces with the MulmoCast library

- **Renderer Process** (`src/renderer/`)
  - Vue.js application with TypeScript
  - Modern UI with Tailwind CSS v4 and Radix Vue components
  - Monaco Editor for JSON/YAML editing
  - Vue I18n for internationalization (English/Japanese)
  - Communicates with main process via IPC

- **Preload Script** (`src/preload/preload.ts`)
  - Bridges main and renderer processes securely
  - Exposes secure APIs via `window.electronAPI`

### 2. IPC Communication Pattern

All communication between renderer and main process goes through defined IPC channels:

```typescript
// Renderer calls main process
await window.electronAPI.project.create(title)
await window.electronAPI.mulmoHandler(method, ...args)

// Main process sends progress updates
webContents.send("progress-update", data)
```

Key IPC handlers in `src/main/ipc_handler.ts`:
- `project:*` - Project management operations
- `settings:*` - Settings management
- `mulmoHandler` - Generic handler for MulmoCast operations
- `dialog:openFile` - File dialog operations

### 3. Data Models

Core types are defined in `src/types/`:

```typescript
// Project structure
Project {
  metadata: ProjectMetadata
  script: MulmoScript | null
}

// Project metadata includes:
ProjectMetadata {
  id: string          // Format: YYYYMMDD-uuid
  title: string
  chatMessages: ChatMessage[]
  presentationStyle?: MulmoPresentationStyle
  // ... other fields
}
```

### 4. State Management

The renderer uses Pinia for state management (`src/renderer/store/index.ts`):

- `mulmoEvent` - Tracks current MulmoCast processing events
- `sessionState` - Tracks active generation sessions per project
- `graphaiDebugLog` - GraphAI processing logs
- `zodError` - Validation errors from Zod schemas

### 5. Project Management

Projects are stored in the user data directory:
- Base path: `{userData}/projects/`
- Each project has its own directory: `{projectId}/`
- Project files:
  - `meta.json` - Project metadata
  - `script.json` - MulmoCast script
  - `output/` - Generated assets
  - `upload_image/` - User-uploaded images

### 6. MulmoCast Integration

The app integrates with the MulmoCast library (`mulmocast` npm package) to:
- Generate AI content (images, audio, video)
- Process presentation scripts
- Handle multimedia pipeline operations

Key MulmoCast operations in `src/main/mulmo/handler.ts`:
- `mulmoActionRunner` - Runs full generation pipelines
- `mulmoGenerateImage/Audio` - Generate individual beat assets
- `mulmoImageFiles/AudioFiles` - Retrieve generated assets

### 7. Environment Variables & Settings

API keys and settings are managed through:
- Settings file: `{userData}/settings.json`
- Environment variables loaded at startup
- Settings UI accessible from app menu
- Available keys defined in `src/shared/constants.ts`:
  - `OPENAI_API_KEY`: OpenAI services (GPT, DALL-E, TTS)
  - `TAVILY_API_KEY`: Web search functionality
  - `ELEVENLABS_API_KEY`: High-quality TTS
  - `GOOGLE_PROJECT_ID`: Google Cloud services
  - `REPLICATE_API_TOKEN`: AI model hosting service

#### Secure API Key Storage

**IMPORTANT**: Never store API keys in plaintext JSON files in production. Instead, implement secure storage:

**Recommended Approach - OS Keychain Services:**
- Use libraries like [Keytar](https://github.com/atom/node-keytar) to leverage OS-level secure storage:
  - macOS: Keychain Access
  - Windows: Credential Manager
  - Linux: Secret Service API/libsecret

**Security Requirements:**
1. **Encryption**: Always encrypt API keys before storage, even with keychain services
2. **Log Redaction**: Ensure keys are never logged in console output, error messages, or crash reports
3. **Environment-Based Storage**:
   - Development: `.env` files (ensure in `.gitignore`)
   - Production: OS keychain or encrypted credential store
4. **Key Rotation**: Support updating keys without app restart
5. **Access Auditing**: Log key access events (not the keys themselves)

**Implementation Example:**
```typescript
// src/main/security/keystore.ts
import keytar from 'keytar';
import crypto from 'crypto';

export class SecureKeyStore {
  private readonly serviceName = 'mulmocast-app';
  
  async storeKey(keyName: string, value: string): Promise<void> {
    const encrypted = this.encrypt(value);
    await keytar.setPassword(this.serviceName, keyName, encrypted);
  }
  
  async getKey(keyName: string): Promise<string | null> {
    const encrypted = await keytar.getPassword(this.serviceName, keyName);
    return encrypted ? this.decrypt(encrypted) : null;
  }
  
  private encrypt(text: string): string {
    // Implement encryption logic
    // Never log the actual key value
  }
  
  private decrypt(encrypted: string): string {
    // Implement decryption logic
    // Ensure errors don't expose key data
  }
}
```

### 8. Build & Development

- Framework: Electron Forge with Vite
- Frontend: Vue 3 with TypeScript and Composition API
- Styling: Tailwind CSS v4 with CSS v4 features
- UI Components: Radix Vue / Reka UI component library
- Editor: Monaco Editor with JSON/YAML syntax support
- State: Pinia store with reactive state management
- Validation: Zod schemas for runtime type safety
- Internationalization: Vue I18n with English/Japanese support
- Testing: Playwright for E2E testing with Electron integration

## Key Workflows

### Creating a Project
1. User clicks "New Project"
2. Renderer calls `window.electronAPI.project.create(title)`
3. Main process creates project directory and files
4. Returns project metadata to renderer

### Generating Content
1. User edits script in Monaco editor
2. User clicks generate button
3. Renderer calls `mulmoHandler("mulmoActionRunner", projectId, actionType)`
4. Main process runs MulmoCast pipeline
5. Progress updates sent via IPC
6. Generated assets saved to project directory

### Accessing Generated Assets
1. Renderer requests assets via `mulmoHandler("mulmoImageFiles", projectId)`
2. Main process reads files and returns as ArrayBuffers
3. Renderer displays assets in UI

## Important Patterns

1. **Always use absolute paths** in main process file operations
2. **ArrayBuffer communication** for binary data (images, audio) between processes
3. **Progress callbacks** for long-running operations via IPC events
4. **Zod validation** for script structure integrity and error handling
5. **Force regeneration** option bypasses caching when needed
6. **Reactive state management** with Pinia stores for UI updates
7. **Component composition** using Vue 3 Composition API patterns
8. **Type safety** with TypeScript throughout the application
9. **Internationalization** support with proper translation keys

## Common Operations

- Reading a project: `getProjectMetadata(projectId)` + `getProjectMulmoScript(projectId)`
- Saving changes: `saveProjectMetadata()` + `saveProjectScript()`
- Running generation: `mulmoActionRunner(projectId, actionName, webContents)`
- Getting output paths: `audioFilePath()`, `movieFilePath()`
- Managing settings: `getSettings()` + `saveSettings()` via settings manager
- Handling media files: Converting to/from ArrayBuffers for IPC transmission
- Error handling: Using Zod validation with proper error messages
- Progress tracking: Real-time updates via IPC event system

## Project Structure Details

### Key Directories

- `src/main/`: Electron main process files
  - `main.ts`: Application entry point
  - `ipc_handler.ts`: IPC communication handlers
  - `project_manager.ts`: Project file operations
  - `settings_manager.ts`: Settings persistence
  - `mulmo/`: MulmoCast integration layer

- `src/renderer/`: Vue.js renderer application
  - `pages/`: Vue route components (dashboard, project, settings)
  - `components/`: Reusable Vue components
  - `components/ui/`: Radix Vue UI component library
  - `store/`: Pinia state management stores
  - `i18n/`: Internationalization files
  - `lib/`: Utility functions and helpers

- `src/shared/`: Shared constants and types
- `src/types/`: TypeScript type definitions
- `test/`: E2E testing with Playwright

### Testing Architecture

The app uses Playwright for E2E testing with Electron integration:

- **Automated E2E Tests** (`test/automated-e2e-test.ts`):
  - Fully automated tests that start/stop Electron app
  - Designed for CI/CD environments (GitHub Actions)
  - Connects via Chrome DevTools Protocol (CDP) on port 9222
  - Includes project creation and UI navigation tests

- **Manual Tests** (`test/manual-electron-test.ts`):
  - Connects to manually started Electron app
  - Useful for development and debugging
  - Same test cases as automated version

- **GitHub Actions Integration** (`.github/workflows/playwright-test.yml`):
  - Runs automated tests on Ubuntu with xvfb (headless)
  - Builds app and runs E2E tests on PRs/pushes
  - Uploads test artifacts including screenshots

**Key Testing Features:**
- CDP connection with retry logic for reliability
- TypeScript-based tests for type safety
- Process cleanup to prevent zombie processes
- Screenshot capture on test failures
- Environment-specific configuration (dev/CI)

### Debugging with Playwright MCP

When the Electron app is running in development mode (`yarn start`), Playwright MCP can connect via CDP for debugging:

**Real-time Debugging Capabilities:**
- **Console Messages**: View all console.log, console.error, and console.warn outputs from both main and renderer processes
- **Network Requests**: Monitor all network requests made by the application
- **Error Inspection**: Catch and inspect JavaScript errors, including stack traces
- **Performance Monitoring**: Track page load times and resource usage
- **Live DOM Inspection**: Take snapshots and screenshots of the current application state

**Usage for Development:**
```bash
# 1. Start Electron app with CDP enabled
yarn start

# 2. Use Claude Code with Playwright MCP to:
# - Take screenshots: mcp__electron-playwright__browser_take_screenshot
# - Capture console messages: mcp__electron-playwright__browser_console_messages
# - Take DOM snapshots: mcp__electron-playwright__browser_snapshot
# - Monitor network: mcp__electron-playwright__browser_network_requests
```

**Benefits for Development:**
- Debug issues without modifying source code
- Monitor application behavior in real-time
- Capture error states for analysis
- Verify UI components are working correctly
- Track down performance bottlenecks

This makes Playwright MCP not just a testing tool, but also a powerful debugging and development companion for the Electron application.

This architecture ensures clean separation between UI and business logic, secure IPC communication, proper integration with the MulmoCast multimedia generation framework, and comprehensive testing coverage.