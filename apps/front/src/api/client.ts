import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

function getBaseURL(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }

  const [tld, domain] = location.hostname.split(".").reverse();
  if (!domain || !tld) return location.origin;
  return `https://api.${domain}.${tld}`;
}

type RetriableRequest = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };

let instance: AxiosInstance | undefined;

export function getInstance(): AxiosInstance {
  if (instance) return instance;

  const client = axios.create({
    baseURL: getBaseURL(),
    timeout: 5000,
    withCredentials: true,
  });
  instance = client;

  let refreshRequest: Promise<void> | null = null;

  client.interceptors.response.use(
    (res) => ({ ...res, data: res.data.data, status: res.data.status }),
    async (err) => {
      const is401 = err.response?.status === 401;
      const isRefreshEndpoint = err.config?.url === "/auth/refresh";
      const isLoginEndpoint = err.config?.url?.startsWith("/auth/login/");
      const config = err.config as RetriableRequest | undefined;

      if (!is401 || isRefreshEndpoint || isLoginEndpoint || !config || config._retriedAfterRefresh) {
        return Promise.reject(err);
      }

      config._retriedAfterRefresh = true;
      refreshRequest ??= client
        .post("/auth/refresh")
        .then(() => undefined)
        .finally(() => {
          refreshRequest = null;
        });

      await refreshRequest;
      return client(config);
    },
  );

  return client;
}
