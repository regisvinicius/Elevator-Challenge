import { getHealth } from "@/api/elevator-api";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, createContext, useContext, useMemo } from "react";

const ApiHealthContext = createContext<{ isOnline: boolean } | null>(null);

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const { data, isSuccess } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 5000,
    retry: 1,
    staleTime: 2000,
  });

  const isOnline = isSuccess && data?.status === "ok";

  const value = useMemo(
    () => ({
      isOnline: isOnline ?? false,
    }),
    [isOnline],
  );

  return (
    <ApiHealthContext.Provider value={value}>
      {children}
    </ApiHealthContext.Provider>
  );
}

export function useApiHealth() {
  const ctx = useContext(ApiHealthContext);
  return ctx ?? { isOnline: true };
}
