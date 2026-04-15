// redux/Store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import { 
  persistReducer, 
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // يستخدم LocalStorage للمتصفح

// إعدادات الحفظ
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["cart"], // نريد حفظ السلة فقط
};

// دمج الـ Reducers
const rootReducer = combineReducers({
  cart: cartReducer,
});

// إنشاء Reducer "خالد"
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // تجاهل هذه الـ Actions الخاصة بالمكتبة لمنع ظهور أخطاء في الـ Console
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;