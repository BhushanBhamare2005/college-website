export class ApiError extends Error {
  constructor(status, message, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}