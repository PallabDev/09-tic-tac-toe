const STATUS_MESSAGES = {
  400: "Please check the details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have access to this action.",
  404: "We could not find what you requested.",
  409: "That action cannot be completed right now.",
  500: "Something went wrong on our side. Please try again soon.",
};

export const getSafeErrorMessage = (error, fallback = "Request failed. Please try again.") => {
  const status = error?.response?.status;
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return STATUS_MESSAGES[500];
  if (error?.code === "ERR_NETWORK") return "Cannot reach the server. Please check your connection.";
  return fallback;
};
