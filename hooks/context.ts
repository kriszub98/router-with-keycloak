import { createContext, useContext } from "react";

export const DashboardContext = createContext<User | undefined>(undefined);

export function useUserContext() {
  const user = useContext(DashboardContext);

  if (user === undefined) {
    throw new Error("useUserContext must be used inside of DashboardContext");
  }

  return user;
}
