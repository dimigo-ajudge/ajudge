import axios, { type AxiosInstance } from "axios";

function getBaseURL(): string {
  const { host } = location;
  if (host === "localhost:5173" || host === "localhost:5174") {
    return "http://localhost:3000";
  }
  const [tld, domain] = host.split(".").reverse();
  return `https://api.${domain}.${tld}`;
}

let instance: AxiosInstance | undefined;

export function getInstance(): AxiosInstance {
  if (instance) return instance;

  instance = axios.create({
    baseURL: getBaseURL(),
    timeout: 5000,
    withCredentials: true,
  });

  let isRefreshing = false;
  let refreshQueue: Array<() => void> = [];

  instance.interceptors.response.use(
    (res) => ({ ...res, data: res.data.data, status: res.data.status }),
    (err) => {
      console.error(err);

      const is401 = err.response?.status === 401;
      const isRefreshEndpoint = err.config?.url === "/auth/refresh";

      if (!is401 || isRefreshEndpoint) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise<void>((resolve) => {
          refreshQueue.push(resolve);
        }).then(() => instance!(err.config));
      }

      isRefreshing = true;
      return instance!
        .post("/auth/refresh")
        .then(() => {
          isRefreshing = false;
          refreshQueue.forEach((cb) => cb());
          refreshQueue = [];
          return instance!(err.config);
        })
        .catch(() => {
          isRefreshing = false;
          refreshQueue = [];
          if (!location.pathname.startsWith("/login")) location.href = "/login";
          return Promise.reject(err);
        });
    },
  );

  return instance;
}
