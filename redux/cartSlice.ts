import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. تعريف هيكل الإضافات (Variations)
export interface CartVariation {
  variationId: string;
  optionId: string;
}

// 2. تحديث هيكل العنصر ليطابق الـ JSON الراجع من الـ API
export interface CartItem {
  cartId: string;         // الـ ID الخاص بصف الاسترجاع/التعديل في السيرفر
  foodId: string;         // الـ ID الخاص بالوجبة نفسها
  name: string;
  image: string;
  restaurantId: string;
  restaurantName: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  variations: CartVariation[] | any[]; 
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  isLoading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // 📥 المزامنة الكاملة: نستخدمها بعد أي استدعاء للـ GET لملء السلة بالداتا الحقيقية
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
// ➕ إضافة عنصر محلياً
    addToCartLocal: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      
      // البحث عن منتج مطابقة (نفس النوع ونفس الإضافات)
      const existingIndex = state.items.findIndex((item) => {
        const isSameFood = item.foodId === newItem.foodId;
        // تحويل المصفوفة لنص للمقارنة العميقة بين الإضافات
        const isSameVariations = JSON.stringify(item.variations) === JSON.stringify(newItem.variations);
        return isSameFood && isSameVariations;
      });

      if (existingIndex !== -1) {
        // تحديث الكمية والسعر للعنصر الموجود
        const existingItem = state.items[existingIndex];
        existingItem.quantity += Number(newItem.quantity);
        existingItem.totalPrice = Number(existingItem.unitPrice) * existingItem.quantity;
        // تحديث الـ cartId لضمان المزامنة مع السيرفر لاحقاً
        existingItem.cartId = newItem.cartId; 
      } else {
        // إضافة منتج جديد
        state.items.push({
          ...newItem,
          quantity: Number(newItem.quantity),
          totalPrice: Number(newItem.unitPrice) * Number(newItem.quantity)
        });
      }
    },
    // ➕ إضافة عنصر محلياً بعد الـ POST
 
    // ❌ حذف عنصر (بعد الـ DELETE من الـ API)
    removeFromCartLocal: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.cartId !== action.payload);
    },

    // ✏️ تحديث الكمية (بعد الـ PUT للـ API)
    updateQuantityLocal: (
      state,
      action: PayloadAction<{ cartId: string; quantity: number }>
    ) => {
      const item = state.items.find((i) => i.cartId === action.payload.cartId);
      if (item) {
        item.quantity = action.payload.quantity;
        item.totalPrice = Number(item.unitPrice) * item.quantity;
      }
    },

    // 🧹 تفريغ السلة بالكامل
    clearCartLocal: (state) => {
      state.items = [];
    },
  },
});

// 👈 هنا يتم تصدير addToCartLocal وباقي الدوال بشكل صحيح
export const {
  setCartItems,
  addToCartLocal,
  removeFromCartLocal,
  updateQuantityLocal,
  clearCartLocal,
} = cartSlice.actions;

export default cartSlice.reducer;