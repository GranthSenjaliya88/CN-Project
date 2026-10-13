# Render deployment

The root Dockerfile builds React with Node 22 and runs the Python API with Gunicorn on Render's PORT. Flask serves the built frontend and its routes from the same origin, so no separate API URL or CORS configuration is required.

Use the root render.yaml Blueprint, or create a Docker web service for this repository's main branch. Leave the root directory blank, use ./Dockerfile, choose the Free instance, and set the health check to /api/health. No secrets, database, or persistent disk are required. Automatic deployments follow main.

Verify /, /simulator, /protocol-lab and /api/health after deployment, then calculate a delayed-ACK run and a packet-loss run. Free instances can take time to wake after inactivity.
