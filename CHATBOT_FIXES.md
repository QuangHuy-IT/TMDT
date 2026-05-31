# Cac viec can sua cho Chatbot

Tai lieu nay ghi lai cac van de hien tai cua chatbot va huong sua de lam sau.

## Muc tieu

- Goi y san pham dung nhu cau nguoi dung hon.
- Khong hien thi UI bi loi nhu so `0`, ten san pham lap lai, anh loi.
- Giam truy van lap lai o backend.
- Tranh loi du lieu bi ghi de khi nhieu user chat cung luc.

## Viec can sua uu tien cao

### 1. Sua loc san pham theo nhu cau

File lien quan:

- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/ai/rag/ProductContextBuilder.java`

Van de:

- Ham `matchesFeatures()` dang `return true` o cuoi, nen neu khong match `gaming`, `camera`, `pin` van tra san pham bat ky.
- Cau hoi nhu `Dien thoai pin trau, camera tot` co the tra ve san pham khong lien quan.

Huong sua:

- Neu query co feature cu the thi san pham phai match it nhat mot feature.
- Bo `return true` mac dinh o cuoi `matchesFeatures()`.
- Bo sung keyword cho tung nhom:
  - `pin`: `pin`, `mah`, `5000`, `6000`, `battery`, `sac nhanh`
  - `camera`: `camera`, `50mp`, `108mp`, `200mp`, `chup anh`, `selfie`
  - `gaming`: `gaming`, `snapdragon`, `dimensity`, `rog`, `redmagic`, `tan nhiet`, `hz`

### 2. Ap dung loc theo ngan sach

File lien quan:

- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/ai/rag/ProductContextBuilder.java`
- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java`

Van de:

- Backend da parse duoc `duoi 15 trieu`, `tren 10 trieu`, nhung `queryProducts()` chua loc theo gia variant.

Huong sua:

- Lay variants theo danh sach product id bang batch query.
- Tinh `minPrice`/`maxPrice` cua moi product.
- Neu co `maxBudget`, chi giu product co `minPrice <= maxBudget`.
- Neu co `minBudget`, chi giu product co `maxPrice >= minBudget`.
- Neu khong co variant hoac khong co gia thi khong dua vao goi y san pham.

### 3. Bo mutable state `currentProducts`

File lien quan:

- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/ai/orchestrator/AIOrchestrator.java`

Van de:

- `AIOrchestrator` la Spring singleton nhung dang dung field `currentProducts`.
- Neu hai request chat chay dong thoi, danh sach product card co the bi ghi de cheo.

Huong sua:

- Khong luu product goi y vao field cua service.
- Tao object ket qua noi bo gom `responseText` va `products`.
- Truyen `products` truc tiep vao `buildChatResponse()`.

### 4. Giam N+1 query khi build product card

File lien quan:

- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/ai/orchestrator/AIOrchestrator.java`
- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java`

Van de:

- `toChatProductDto()` dang query variant rieng cho tung product.

Huong sua:

- Dung `findByProductIdInAndDeletedAtIsNull(...)`.
- Group variants theo `productId`.
- Build `ChatProductDto` bang map variant da group.

## Viec can sua frontend

### 5. Khong hien so `0` trong card chatbot

File lien quan:

- `FrontEnd/src/components/contact/ChatbotPopup.jsx`

Van de:

- JSX `{product.salePercent && (...)}` se render so `0` neu `salePercent = 0`.

Huong sua:

- Doi thanh:

```jsx
{Number(product.salePercent) > 0 && (
  <span>-{Math.round(product.salePercent)}%</span>
)}
```

### 6. Sua fallback anh san pham

File lien quan:

- `FrontEnd/src/components/contact/ChatbotPopup.jsx`

Van de:

- Khi anh loi, browser co the hien `alt` trong khung anh, dan den ten san pham bi lap.
- Fallback `/placeholder.png` co the khong ton tai.

Huong sua:

- Dung fallback dang ton tai trong project, vi du `/placeholder-product.png`, hoac URL placeholder on dinh.
- Khi `onError`, tranh lap vo han:

```jsx
onError={(e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = '/placeholder-product.png';
}}
```

### 7. Dung chung component recommendation compact

File lien quan:

- `FrontEnd/src/components/contact/ChatbotPopup.jsx`
- `FrontEnd/src/components/ui/RecommendationCards.jsx`

Van de:

- `ChatbotPopup.jsx` dang render card san pham thu cong.
- Trong project da co `CompactRecommendationList`, de bi lech UI va logic.

Huong sua:

- Tach card chatbot thanh component rieng hoac dung `CompactRecommendationList`.
- Dam bao route san pham dung `/products/{slug}`.
- Dam bao khong click neu khong co slug hop le.

## Viec can cai tien chat response

### 8. Quyet dinh hien text hay card

Van de:

- Hien tai AI co the tra text liet ke san pham, frontend lai hien them product card.
- Ket qua de bi trung lap noi dung.

Huong sua de chon:

- Phuong an A: Giu ca text va card, nhung prompt AI chi viet tu van ngan, khong liet ke lai ten/gia tung san pham.
- Phuong an B: Bo product card, chi dung text AI.
- Phuong an C: Text AI tom tat ly do, product card hien danh sach san pham. Nen chon phuong an C.

### 9. Cai thien intent detection

File lien quan:

- `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/ai/intent/IntentDetector.java`

Van de:

- Keyword `"voi"`, `"hay"` trong compare qua rong, de bat nham y dinh so sanh.

Huong sua:

- Chi coi la compare khi co it nhat 2 ten san pham hoac co pattern ro nhu `so sanh`, `A vs B`, `A voi B`.
- Khong de mot tu don le nhu `hay` day intent sang compare.

## Thu tu thuc hien de xuat

1. Sua frontend loi hien `0` va fallback anh.
2. Sua `matchesFeatures()` de goi y dung nhu cau.
3. Them loc gia theo variant.
4. Bo `currentProducts` mutable state.
5. Batch query variants.
6. Chuan hoa prompt/UI de text va card khong lap nhau.

## Kiem tra sau khi sua

- Hoi: `Dien thoai pin trau, camera tot`
  - Khong tra san pham random khong lien quan.
  - Khong hien so `0`.
  - Anh loi khong lam lap ten san pham.

- Hoi: `Tim dien thoai gaming duoi 15 trieu`
  - San pham tra ve co gia variant phu hop ngan sach.
  - Uu tien may co dau hieu gaming/hieu nang cao.

- Hoi: `Bao hanh nhu the nao?`
  - Khong hien product card.
  - Chi tra loi FAQ.

- Hoi dong thoi tu 2 session khac nhau.
  - Product cards khong bi lan giua 2 user.

