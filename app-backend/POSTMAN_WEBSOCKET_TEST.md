# Postman WebSocket Test Guide

## Vấn đề: WebSocket connect nhưng không thấy data

Motia Streams sử dụng WebSocket nhưng cần **subscribe vào stream cụ thể** theo protocol của Motia. Postman WebSocket client chỉ connect được, nhưng để nhận data cần:

1. **Cron Step đã chạy và push data vào stream** (hoặc manual trigger)
2. **Client subscribe vào stream** theo Motia protocol

## Cách Test

### Bước 1: Trigger Stream Update (Push data vào stream)

**POST** `http://localhost:3001/devtools/test-stream-update`

Response:
```json
{
  "success": true,
  "message": "Stream updated successfully. Check WebSocket connection.",
  "overview": {
    "groupId": "global",
    "id": "global",
    "data": {
      "totalRequests24h": 123456,
      "currentRps": 1345.6,
      "errorRate": 0.0123,
      "uptime30d": 0.9995,
      "updatedAt": "2025-11-21T11:13:19.658Z"
    }
  }
}
```

### Bước 2: Check Stream Data (Verify data đã được push)

**GET** `http://localhost:3001/devtools/stream-data`

Response:
```json
{
  "metricsOverview": {
    "groupId": "global",
    "id": "global",
    "data": {
      "totalRequests24h": 123456,
      "currentRps": 1345.6,
      "errorRate": 0.0123,
      "uptime30d": 0.9995,
      "updatedAt": "2025-11-21T11:13:19.658Z"
    }
  },
  "metricsByChain": [
    {
      "groupId": "chains",
      "id": "story-mainnet",
      "data": {
        "chain": "story",
        "env": "mainnet",
        "requests24h": 3456789,
        "currentRps": 234.5,
        "errorRate": 0.008,
        "latencyP50": 42.1,
        "latencyP95": 85.3
      }
    }
  ]
}
```

### Bước 3: Test WebSocket trên Postman

**WebSocket URL:** `ws://localhost:3001`

**Lưu ý:** 
- Postman WebSocket client có thể connect được
- Nhưng để **subscribe vào Motia streams**, cần dùng **official Motia stream client** (`@motiadev/stream-client-react`)
- Motia streams sử dụng protocol riêng để subscribe, không phải plain WebSocket message

### Bước 4: Test với Official Client (Recommended)

Thay vì test trên Postman, nên test với official Motia stream client:

```bash
cd app-homepage
npm install @motiadev/stream-client-react
```

Sau đó dùng `useStream()` hook như trong `global-metrics-stream.tsx` đã tạo.

## Troubleshooting

### Không thấy data trên WebSocket

1. **Check Cron Step có chạy không:**
   - Xem logs trong terminal chạy `npm run dev` ở `app-backend`
   - Tìm log: `"Refreshing RPC metrics from ClickHouse"`
   - Tìm log: `"Updated metricsOverview stream"`

2. **Manual trigger stream update:**
   ```bash
   curl -X POST http://localhost:3001/devtools/test-stream-update
   ```

3. **Check stream data:**
   ```bash
   curl http://localhost:3001/devtools/stream-data
   ```

4. **Verify Cron expression:**
   - Cron: `*/5 * * * * *` = mỗi 5 giây
   - Nếu không chạy, check logs xem có error không

### WebSocket connect nhưng không nhận message

- **Motia streams không phải plain WebSocket** - cần subscribe theo protocol
- **Dùng official client** (`@motiadev/stream-client-react`) thay vì Postman
- **Hoặc check Workbench** tại `http://localhost:3000` để xem stream updates real-time

## Alternative: Test với Workbench

Motia Workbench tự động subscribe vào streams khi bạn test API endpoints:

1. Mở `http://localhost:3000` (Motia Workbench)
2. Test endpoint `/metrics/overview`
3. Workbench sẽ tự động hiển thị stream updates real-time

