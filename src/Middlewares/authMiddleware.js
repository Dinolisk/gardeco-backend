export const authMiddleware = (req, res, next) => {
  // Get the API key from the request headers
  const apiKey = req.headers['x-api-key'];

  // Check if API key exists and matches the expected value
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid API key'
    });
  }

  // If authentication is successful, proceed to the next middleware/route handler
  next();
};
