# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/da72f314-c829-4fb3-8024-53b12a605fd8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/da72f314-c829-4fb3-8024-53b12a605fd8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Control the Arduino over Web Serial

This UI can directly control an Arduino (or any serial device) using the browser's Web Serial API. It's great for sending movement commands with the on-screen buttons that map to WASD keys your Arduino already understands.

Supported browsers:

- Chrome or Edge on desktop (HTTPS or localhost only). Safari/Firefox do not support Web Serial yet.

How to use:

1. Start the dev server.
2. Open the app in Chrome/Edge.
3. Click "Connect" in the Arduino Connection panel.
4. Select your Arduino serial port and confirm at 9600 baud (default).
5. Use the Movement buttons (or press W/A/S/D) to send single-character commands:
	- forward: `w`
	- left: `a`
	- backward: `s`
	- right: `d`

Notes:

- Your Arduino sketch should read single characters from Serial at the chosen baud rate and act accordingly.
- If nothing happens, make sure the correct port is selected and that the board isn't already open in another app (Arduino IDE Serial Monitor, etc.). Close other apps and reconnect.
- Disconnect anytime from the same panel.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/da72f314-c829-4fb3-8024-53b12a605fd8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
