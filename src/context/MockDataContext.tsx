import {
  ModuleConfig,
  FirebaseDataContextType,
  FirebaseDataProvider,
  useFirebase,
} from "../firebase-service";

export type { ModuleConfig };
export type MockDataContextType = FirebaseDataContextType;
export const MockDataProvider = FirebaseDataProvider;
export const useMockData = useFirebase;
export default MockDataProvider;
