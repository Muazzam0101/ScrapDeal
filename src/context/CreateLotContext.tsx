import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MaterialCategoryId, PickupOption, HandoverChecklistState, PaymentMethod } from '../types';

interface CreateLotContextType {
  photoCaptured: boolean;
  setPhotoCaptured: (captured: boolean) => void;
  photoUris: string[];
  setPhotoUris: (uris: string[]) => void;
  addPhotoUri: (uri: string) => void;
  categoryId: MaterialCategoryId | null;
  setCategoryId: (id: MaterialCategoryId | null) => void;
  weightKg: number;
  setWeightKg: (w: number) => void;
  ratePerKg: number;
  setRatePerKg: (r: number) => void;
  pickupOption: PickupOption;
  setPickupOption: (opt: PickupOption) => void;
  checklist: HandoverChecklistState;
  setChecklist: React.Dispatch<React.SetStateAction<HandoverChecklistState>>;
  toggleChecklistItem: (key: keyof HandoverChecklistState) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  createdLotId: string | null;
  setCreatedLotId: (id: string | null) => void;
  resetLot: () => void;
}

const defaultChecklist: HandoverChecklistState = {
  weightVerified: true,
  photoCaptured: true,
  locationConfirmed: true,
  timestampConfirmed: true,
};

const CreateLotContext = createContext<CreateLotContextType | undefined>(undefined);

export const CreateLotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [photoCaptured, setPhotoCaptured] = useState<boolean>(true);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<MaterialCategoryId | null>('pcb');
  const [weightKg, setWeightKg] = useState<number>(15);
  const [ratePerKg, setRatePerKg] = useState<number>(280);
  const [pickupOption, setPickupOption] = useState<PickupOption>('collector_drop');
  const [checklist, setChecklist] = useState<HandoverChecklistState>(defaultChecklist);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [createdLotId, setCreatedLotId] = useState<string | null>(null);

  const addPhotoUri = (uri: string) => {
    setPhotoUris((prev) => [...prev, uri]);
    setPhotoCaptured(true);
  };

  const toggleChecklistItem = (key: keyof HandoverChecklistState) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetLot = () => {
    setPhotoCaptured(true);
    setPhotoUris([]);
    setCategoryId('pcb');
    setWeightKg(15);
    setRatePerKg(280);
    setPickupOption('collector_drop');
    setChecklist(defaultChecklist);
    setPaymentMethod('cash');
    setCreatedLotId(null);
  };

  return (
    <CreateLotContext.Provider
      value={{
        photoCaptured,
        setPhotoCaptured,
        photoUris,
        setPhotoUris,
        addPhotoUri,
        categoryId,
        setCategoryId,
        weightKg,
        setWeightKg,
        ratePerKg,
        setRatePerKg,
        pickupOption,
        setPickupOption,
        checklist,
        setChecklist,
        toggleChecklistItem,
        paymentMethod,
        setPaymentMethod,
        createdLotId,
        setCreatedLotId,
        resetLot,
      }}
    >
      {children}
    </CreateLotContext.Provider>
  );
};

export const useCreateLot = (): CreateLotContextType => {
  const context = useContext(CreateLotContext);
  if (!context) {
    throw new Error('useCreateLot must be used within a CreateLotProvider');
  }
  return context;
};
