class ErrorLens {
  constructor() {
    this.apiKey = null;

    // LOCAL DEV URL
    this.apiUrl = apiUrl||"http://localhost:5000/api/errors";
  }

  init({ apiKey, apiUrl }) {
    if (!apiKey) {
      throw new Error("ErrorLens API key is required");
    }

    this.apiKey = apiKey;

    // CUSTOM BACKEND URL
    if (apiUrl) {
      this.apiUrl = apiUrl;
    }

    // console.log("ErrorLens initialized");

    // START GLOBAL ERROR LISTENERS
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {

    // NORMAL JS ERRORS
    window.onerror = (message, source, lineno, colno, error) => {

      this.captureException({
        error: message,
        stack: error?.stack || "No stack trace",
        service: "frontend",
      });
    };

    // PROMISE REJECTIONS
    window.onunhandledrejection = (event) => {

      this.captureException({
        error: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack || "No stack trace",
        service: "frontend",
      });
    };
  }

  async captureException(payload) {
    try {
      await fetch(this.apiUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },

        body: JSON.stringify(payload),
      });

      // console.log("Error sent to ErrorLens");

    } catch (err) {

      console.error(
        "ErrorLens SDK failed to send error:",
        err
      );
    }
  }
}

export default new ErrorLens();