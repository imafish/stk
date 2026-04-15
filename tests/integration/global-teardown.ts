import * as http from "http";

export default async function globalTeardown() {
  const server = (global as unknown as { __TEST_SERVER__: http.Server }).__TEST_SERVER__;
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
