# Deployment Guide

This guide will help you deploy the Mathematical Outline Generator to GitHub and Render.

## GitHub Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Mathematical Outline Generator"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `mathematical-outline-generator` (or your preferred name)
3. Make it public or private as you prefer
4. **Don't** initialize with README, .gitignore, or license (we already have these)

### 3. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/mathematical-outline-generator.git
git branch -M main
git push -u origin main
```

## Render Deployment

### 1. Connect to Render
1. Go to [Render](https://render.com) and sign up/login
2. Click "New +" and select "Static Site"
3. Connect your GitHub account if not already connected
4. Select your `mathematical-outline-generator` repository

### 2. Configure Deployment Settings
- **Name**: `mathematical-outline-generator` (or your preferred name)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Static Site

### 3. Environment Variables (Optional)
You can add these if needed:
- `NODE_VERSION`: `18.0.0`

### 4. Deploy
Click "Create Static Site" and Render will automatically:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Run the build command
4. Deploy your site

## Alternative: Netlify Deployment

If you prefer Netlify, here's how:

### 1. Connect to Netlify
1. Go to [Netlify](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your repository

### 2. Configure Build Settings
- **Build command**: `npm run build` (or leave empty for static site)
- **Publish directory**: `.` (root directory)

### 3. Deploy
Click "Deploy site" and Netlify will handle the rest.

## Local Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

This will start a local server at `http://localhost:3000`

## File Structure
```
mathematical-outline-generator/
├── index.html          # Main application
├── styles.css          # Styling
├── script.js           # JavaScript logic
├── demo.html           # Demo page
├── package.json        # Node.js configuration
├── .gitignore          # Git ignore rules
├── render.yaml         # Render configuration
├── public/
│   └── _redirects      # Routing for SPA
├── README.md           # Documentation
└── DEPLOYMENT.md       # This file
```

## Troubleshooting

### Common Issues

1. **Build Fails**: Make sure all files are committed to GitHub
2. **Port Issues**: The `$PORT` environment variable is automatically set by Render
3. **CORS Issues**: The application runs entirely in the browser, so CORS shouldn't be an issue
4. **Image Upload Not Working**: Make sure you're using HTTPS in production

### Render-Specific Notes

- The application is a static site, so no server-side processing is needed
- All image processing happens in the browser using JavaScript
- The `http-server` package is used to serve the static files
- The `$PORT` environment variable is automatically provided by Render

### Performance Optimization

- Images are automatically scaled down for processing
- Edge detection is optimized for real-time performance
- Contour simplification reduces mathematical complexity
- CSS generation is optimized for web use

## Custom Domain (Optional)

### Render
1. Go to your site settings in Render
2. Click "Custom Domains"
3. Add your domain and follow the DNS instructions

### Netlify
1. Go to your site settings in Netlify
2. Click "Domain management"
3. Add your custom domain and configure DNS

## Monitoring

- Render provides built-in monitoring and logs
- Check the "Logs" tab in your Render dashboard for any issues
- The application includes error handling and user feedback

## Updates

To update your deployed site:
1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically redeploy

```bash
git add .
git commit -m "Update: [describe your changes]"
git push
```

That's it! Your Mathematical Outline Generator should now be live and accessible via the URL provided by Render.
