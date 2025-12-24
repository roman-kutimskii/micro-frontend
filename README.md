# Vite React Micro-Frontend Example

This repository demonstrates a simple micro-frontend setup using Vite, React, and module federation. Two separate Vite apps are
included:

- **remote/**: exposes a `Greeting` React component through a federated bundle.
- **host/**: consumes the remote `Greeting` component at runtime.

## Prerequisites
- Node.js 18+
- npm

## Getting started
Install dependencies in each project and start both dev servers (use separate terminals):

```bash
# Terminal 1
cd remote
npm install
npm run dev -- --host --port 5001

# Terminal 2
cd host
npm install
npm run dev -- --host --port 5000
```

Open the host app at [http://localhost:5000](http://localhost:5000). The host will fetch the remote component from [http://local
host:5001/assets/remoteEntry.js](http://localhost:5001/assets/remoteEntry.js).

## Building for production

```bash
# Remote bundle (emits remoteEntry.js)
npm --prefix remote install
npm --prefix remote run build

# Host bundle
npm --prefix host install
npm --prefix host run build
```

Use `npm --prefix <app> run preview` to preview each build locally.

## Deploying to GitHub Pages

A GitHub Actions workflow builds both apps and publishes the host plus remote bundle to Pages. The `BASE_PATH` environment vari
able in the workflow matches the repository name to ensure assets resolve correctly when served from `https://<user>.github.io/<
repo>/`.

Local production builds with a custom base path can be tested manually by setting the environment variable:

```bash
# Replace <repo> with your repository name
BASE_PATH=<repo> npm --prefix remote run build -- --outDir dist/remote
BASE_PATH=<repo> npm --prefix host run build
```

The remote build is expected to be published at `/remote/remoteEntry.js` relative to the site root. The workflow assembles the h
ost build at the root of the Pages artifact and copies the remote bundle into `/remote`.
