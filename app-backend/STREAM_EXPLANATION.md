# Motia Streams - Cách hoạt động thực tế

## ❌ Hiểu lầm: Phải POST để trigger stream

**KHÔNG ĐÚNG!** Frontend KHÔNG cần POST gì cả.

## ✅ Cách hoạt động thực tế:

### 1. Backend (Tự động)

```
Cron Step (mỗi phút)
  ↓
Query ClickHouse
  ↓
Push vào stream: streams.metricsOverview.set("global", "global", data)
  ↓
WebSocket tự động broadcast xuống TẤT CẢ clients đang subscribe
```

**KHÔNG CẦN POST!** Cron Step tự động chạy.

### 2. Frontend (Chỉ cần subscribe)

```tsx
// Dùng official Motia client
import { useStream } from '@motiadev/stream-client-react'

function Metrics() {
  // Subscribe vào stream - TỰ ĐỘNG nhận updates
  const { data } = useStream({
    groupId: 'global',
    id: 'global',
    streamName: 'metricsOverview'
  })
  
  // data tự động update mỗi khi Cron Step push data mới
  // KHÔNG CẦN POST, KHÔNG CẦN POLLING!
}
```

## Vấn đề hiện tại:

### 1. Cron Step có đang chạy không?

**Check logs trong terminal chạy `npm run dev`:**

Tìm log:
```
"Refreshing RPC metrics from ClickHouse"
"Updated metricsOverview stream"
```

Nếu KHÔNG thấy → Cron Step không chạy.

### 2. WebSocket không nhận được trên Postman?

**Nguyên nhân:** Postman là plain WebSocket client, không hiểu Motia stream protocol.

**Giải pháp:**
- ✅ Dùng official Motia client (`@motiadev/stream-client-react`)
- ✅ Hoặc test trên Motia Workbench (`http://localhost:3000`)

## So sánh:

### ❌ Polling (cách cũ):
```tsx
// Frontend phải tự fetch mỗi X giây
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/metrics/overview') // ← Phải tự gọi
  }, 5000)
}, [])
```

### ✅ Streams (cách mới):
```tsx
// Frontend chỉ subscribe, tự động nhận updates
const { data } = useStream({ ... }) // ← Tự động nhận, không cần fetch
```

## Flow thực tế:

1. **Cron Step chạy** (tự động mỗi phút)
2. **Query ClickHouse** → Lấy data mới
3. **Push vào stream** → `streams.metricsOverview.set(...)`
4. **WebSocket broadcast** → Tất cả clients nhận update tự động
5. **Frontend re-render** → UI update với data mới

**KHÔNG CẦN POST! KHÔNG CẦN POLLING!**

## Test:

### Check Cron Step:
```bash
# Xem logs
cd app-backend
npm run dev
# Tìm: "Refreshing RPC metrics from ClickHouse"
```

### Test Stream Data:
```bash
# Check stream có data chưa
curl http://localhost:3001/devtools/stream-data
```

### Test WebSocket:
- **Official client**: Tự động nhận updates
- **Postman**: Không nhận được (không hiểu protocol)
- **Workbench**: Tự động nhận updates

## Kết luận:

- ✅ **Cron Step tự động chạy** → Push data vào stream
- ✅ **WebSocket tự động broadcast** → Clients nhận updates
- ✅ **Frontend chỉ cần subscribe** → Không cần POST, không cần polling
- ❌ **POST endpoint chỉ để test** → Không phải cách dùng production

