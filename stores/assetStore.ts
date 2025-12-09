
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Asset } from '../types';

interface AssetStore {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
}

export const useAssetStore = create<AssetStore>()(
  persist(
    (set, get) => ({
      assets: [],
      addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
      updateAsset: (id, updates) => set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a))
      })),
      deleteAsset: (id) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== id)
      })),
      getAsset: (id) => get().assets.find((a) => a.id === id),
    }),
    {
      name: 'ownima_asset_inventory',
    }
  )
);
