// TODO: Replace mock data with actual API calls when backend is ready
// Expected endpoint: GET /users/:userId/coins

export interface CoinBalance {
  userId: string;
  balance: number;
  totalEarned: number;
  lastUpdated: string;
}

const MOCK_DATA: Record<string, CoinBalance> = {
  default: {
    userId: "mock-user",
    balance: 1250,
    totalEarned: 3400,
    lastUpdated: new Date().toISOString(),
  },
};

export const coinService = {
  getBalance: async (userId: string): Promise<CoinBalance> => {
    // Simulates network delay
    await new Promise((res) => setTimeout(res, 150));
    return { ...(MOCK_DATA[userId] ?? MOCK_DATA.default), userId };
  },
};
