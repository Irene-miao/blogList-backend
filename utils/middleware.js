const logger = require("./logger");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Print request info sent to server
const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path: ", request.path);
  logger.info("Body: ", request.body);
  logger.info("---");
  next();
};

// Catch requests to non-existent routes
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// Express error handlers
const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "CastError" && error.kind === "ObjectId" ) {
    return response.status(400).json({ error: 'malformatted id '});
  } else if (error.name ===  "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: 'invalid token'})
  }
  next(error);
};

// Get token
const tokenExtractor = (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    request.token = authorization.substring(7);
  }

  next();
};

const userExtractor = async (request, response, next) => {
  const decodedToken = await jwt.verify(request.token, process.env.SECRET);

  if (request.token || decodedToken) {
    const user = await User.findById(decodedToken.id);
    request.user = user;
  } else {
    return response
      .status(401)
      .json({ error: "Missing token or invalid user" });
  }

  next();
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
