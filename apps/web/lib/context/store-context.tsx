"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

export const PRESET_STORES: ConnectedStore[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    name: "RunFast Sports",
    city: "Bengaluru",
    phone: "+91 98765 00000",
    email: "merchant@runfastsports.in",
    role: "Store Owner & Admin",
    currency: "INR",
    isActive: true,
    color: "#2563EB",
    tagline: "Premium Road & Trail Running Equipment",
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    name: "SpeedGear",
    city: "Mumbai",
    phone: "+91 98111 22334",
    email: "support@speedgear.in",
    role: "Regional Manager",
    currency: "INR",
    isActive: true,
    color: "#7C3AED",
    tagline: "Athletic Performance Wear & Marathons",
  },
];

interface StoreContextType {
  currentStore: ConnectedStore;
  stores: ConnectedStore[];
  switchStore: (storeId: string) => void;
  refreshTrigger: number;
}

const StoreContext = createContext<StoreContextType>({
  currentStore: PRESET_STORES[0],
  stores: PRESET_STORES,
  switchStore: () => {},
  refreshTrigger: 0,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStore, setCurrentStore] = useState<ConnectedStore>(PRESET_STORES[0]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    try {
      const savedId = localStorage.getItem("agentbridge_selected_store_id");
      if (savedId) {
        const found = PRESET_STORES.find((s) => s.id === savedId);
        if (found) setCurrentStore(found);
      }
    } catch (e) {
      // ignore in SSR or restricted storage
    }
  }, []);

  const switchStore = (storeId: string) => {
    const found = PRESET_STORES.find((s) => s.id === storeId);
    if (found) {
      setCurrentStore(found);
      try {
        localStorage.setItem("agentbridge_selected_store_id", storeId);
      } catch (e) {}
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        stores: PRESET_STORES,
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
