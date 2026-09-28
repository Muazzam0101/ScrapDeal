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
  selectedCategories: MaterialCategoryId[];
  setSelectedCategories: (ids: MaterialCategoryId[]) => void;
  toggleCategory: (id: MaterialCategoryId) => void;
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
  aiPredictionId: string | null;
  aiPredictedCategory: MaterialCategoryId | null;
  aiConfidence: number | null;
  aiUserConfirmed: boolean;
  setAiPredictionData: (data: {
    predictionId?: string | null;
    predictedCategory?: MaterialCategoryId | null;
    confidence?: number | null;
    userConfirmed?: boolean;
  }) => void;
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
  const [selectedCategories, setSelectedCategories] = useState<MaterialCategoryId[]>(['pcb']);
  const [weightKg, setWeightKg] = useState<number>(15);
  const [ratePerKg, setRatePerKg] = useState<number>(280);
  const [pickupOption, setPickupOption] = useState<PickupOption>('collector_drop');
  const [checklist, setChecklist] = useState<HandoverChecklistState>(defaultChecklist);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [createdLotId, setCreatedLotId] = useState<string | null>(null);
  const [aiPredictionId, setAiPredictionId] = useState<string | null>(null);
  const [aiPredictedCategory, setAiPredictedCategory] = useState<MaterialCategoryId | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiUserConfirmed, setAiUserConfirmed] = useState<boolean>(true);

  const handleSetCategoryId = (id: MaterialCategoryId | null) => {
    setCategoryId(id);
    if (id && !selectedCategories.includes(id)) {
      setSelectedCategories([id]);
    }
  };

  const handleSetSelectedCategories = (ids: MaterialCategoryId[]) => {
    setSelectedCategories(ids);
    if (ids.length > 0 && (!categoryId || !ids.includes(categoryId))) {
      setCategoryId(ids[0]);
    } else if (ids.length === 0) {
      setCategoryId(null);
    }
  };

  const toggleCategory = (id: MaterialCategoryId) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((c) => c !== id) : [...prev, id];
      if (next.length > 0 && (!categoryId || !next.includes(categoryId))) {
        setCategoryId(next[0]);
      } else if (next.length === 0) {
        setCategoryId(null);
      }
      return next;
    });
  };

  const setAiPredictionData = (data: {
    predictionId?: string | null;
    predictedCategory?: MaterialCategoryId | null;
    confidence?: number | null;
    userConfirmed?: boolean;
  }) => {
    if (data.predictionId !== undefined) setAiPredictionId(data.predictionId);
    if (data.predictedCategory !== undefined) setAiPredictedCategory(data.predictedCategory);
    if (data.confidence !== undefined) setAiConfidence(data.confidence);
    if (data.userConfirmed !== undefined) setAiUserConfirmed(data.userConfirmed);
  };

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
    setSelectedCategories(['pcb']);
    setWeightKg(15);
    setRatePerKg(280);
    setPickupOption('collector_drop');
    setChecklist(defaultChecklist);
    setPaymentMethod('cash');
    setCreatedLotId(null);
    setAiPredictionId(null);
    setAiPredictedCategory(null);
    setAiConfidence(null);
    setAiUserConfirmed(true);
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
        setCategoryId: handleSetCategoryId,
        selectedCategories,
        setSelectedCategories: handleSetSelectedCategories,
        toggleCategory,
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
        aiPredictionId,
        aiPredictedCategory,
        aiConfidence,
        aiUserConfirmed,
        setAiPredictionData,
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
