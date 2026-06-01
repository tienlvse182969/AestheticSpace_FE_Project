const REMEMBER_KEY = "rememberMe";

export const tokenStore = {
  isRemembered: (): boolean =>
    localStorage.getItem(REMEMBER_KEY) === "true",

  getAccessToken: (): string | null =>
    sessionStorage.getItem("accessToken") ?? localStorage.getItem("accessToken"),

  getRefreshToken: (): string | null =>
    sessionStorage.getItem("refreshToken") ?? localStorage.getItem("refreshToken"),

  setTokens: (accessToken: string, refreshToken: string, remember: boolean) => {
    const primary = remember ? localStorage : sessionStorage;
    const secondary = remember ? sessionStorage : localStorage;
    primary.setItem("accessToken", accessToken);
    primary.setItem("refreshToken", refreshToken);
    secondary.removeItem("accessToken");
    secondary.removeItem("refreshToken");
    localStorage.setItem(REMEMBER_KEY, String(remember));
  },

  clearTokens: () => {
    ["accessToken", "refreshToken"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    localStorage.removeItem(REMEMBER_KEY);
  },
};
