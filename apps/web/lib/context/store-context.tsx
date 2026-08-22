"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";

export interface ConnectedStore {
  id: string;
  name: string;
  city: string;
  phone: string;
  email: string;
  role: string;
  currency: string;
  isActive: boolean;
  color: string;
  tagline: string;
}

interface StoreContextType {
  currentStore: ConnectedStore;
  stores: ConnectedStore[];
  switchStore: (storeId: string) => void;
  refreshTrigger: number;
}

const defaultStore: ConnectedStore = {
  id: "store_default",
  name: "My Store",
  city: "Bengaluru",
  phone: "+91 98765 00000",
  email: "merchant@zapai.io",
  role: "Store Owner & Admin",
  currency: "INR",
  isActive: true,
  color: "#2563EB",
  tagline: "AI-Powered Storefront",
};

const StoreContext = createContext<StoreContextType>({
  currentStore: defaultStore,
  stores: [defaultStore],
  switchStore: () => {},
  refreshTrigger: 0,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentStore, setCurrentStore] = useState<ConnectedStore>(defaultStore);
  const [stores, setStores] = useState<ConnectedStore[]>([defaultStore]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user) {
      const userStore: ConnectedStore = {
        id: user.storeId || "store_default",
        name: user.storeName || "My Store",
        city: user.storeCity || "Bengaluru",
        phone: user.phone || "+91 98765 00000",
        email: user.email,
        role: "Store Owner & Admin",
        currency: "INR",
        isActive: true,
        color: "#2563EB",
        tagline: "Autonomous Agentic Commerce",
      };

      setStores([userStore]);
      setCurrentStore(userStore);

      if (user.storeId && typeof window !== "undefined") {
        localStorage.setItem("zapai_selected_store_id", user.storeId);
      }
    }
  }, [user]);

  const switchStore = (storeId: string) => {
    const found = stores.find((s) => s.id === storeId);
    if (found) {
      setCurrentStore(found);
      try {
        localStorage.setItem("zapai_selected_store_id", storeId);
      } catch (e) {}
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        stores,
        switchStore,
        refreshTrigger,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
