# ErrorLens SDK

Realtime error monitoring for JavaScript applications.

## Installation

npm install @rajatsingh45/errorlens-sdk

## Step 1: Create Account

Visit https://your-frontend-url

Register and create a project.

## Step 2: Copy API Key

Dashboard → Projects → Copy API Key

## Step 3: Initialize SDK

import ErrorLens from "@rajatsingh45/errorlens-sdk";

ErrorLens.init({
  apiKey: "YOUR_API_KEY"
});

## Step 4: Capture Errors

try {
  throw new Error("Test Error");
} catch (err) {
  ErrorLens.capture(err);
}

## Automatic Capture

The SDK automatically captures:

- JavaScript runtime errors
- Unhandled Promise rejections

## Dashboard

View errors, AI analysis and fix suggestions inside ErrorLens.