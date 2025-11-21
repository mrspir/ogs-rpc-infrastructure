# WebSocket Test Guide - Postman/OriginStake Client

## Vấn đề: WebSocket CONNECTED nhưng không thấy data

WebSocket đã connect thành công (`ws://localhost:3001`), nhưng không thấy data vì:

1. **Stream chưa có data** - Cron Step có thể chưa chạy hoặc chưa push data
2. **Cần trigger stream update** để test

## Cách Test

### Bước 1: Trigger Stream Update (Push data vào stream)

**POST** `http://localhost:3001/devtools/test-stream-update`

Body: `{}` (empty JSON)

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
      "updatedAt": "2025-11-21T11:15:36.310Z"
    }
  }
}
```

### Bước 2: Check WebSocket Message

Sau khi gọi POST endpoint, **quay lại WebSocket client** (Postman/OriginStake):

- **Nếu dùng official Motia client** (`@motiadev/stream-client-react`): Sẽ tự động nhận message
- **Nếu dùng plain WebSocket**: Có thể cần subscribe theo Motia protocol

### Bước 3: Verify Stream Data

**GET** `http://localhost:3001/devtools/stream-data`

Response sẽ cho biết stream có data chưa:
```json
{
  "metricsOverview": {
    "groupId": "global",
    "id": "global",
    "data": { ... }
  }
}
```

## Lưu ý về Motia Streams Protocol

Motia streams sử dụng **protocol riêng** để subscribe. Plain WebSocket client (Postman) có thể:

- ✅ **Connect** được WebSocket
- ❌ **Không tự động subscribe** vào streams
- ❌ **Không nhận messages** trừ khi dùng official client

### Giải pháp:

1. **Dùng Official Client** (Recommended):
   ```bash
   npm install @motiadev/stream-client-react
   ```
   Client này tự động handle subscribe protocol

2. **Test trên Motia Workbench**:
   - Mở `http://localhost:3000`
   - Test endpoint `/metrics/overview`
   - Workbench tự động subscribe và hiển thị stream updates

3. **Manual Test Flow**:
   - Gọi `POST /devtools/test-stream-update` → Push data
   - Gọi `GET /devtools/stream-data` → Verify data đã có
   - Nếu dùng official client → Sẽ tự động nhận update

## Quick Test Script

```bash
# 1. Trigger stream update
curl -X POST http://localhost:3001/devtools/test-stream-update

# 2. Check stream data
curl http://localhost:3001/devtools/stream-data

# 3. Check Cron Step logs (trong terminal chạy npm run dev)
# Tìm: "Refreshing RPC metrics from ClickHouse"
# Tìm: "Updated metricsOverview stream"
```

## Troubleshooting

### WebSocket CONNECTED nhưng không có message

**Nguyên nhân:**
- Stream chưa có data (Cron chưa chạy)
- Client chưa subscribe (cần official client)

**Giải pháp:**
1. Gọi `POST /devtools/test-stream-update` để push data
2. Gọi `GET /devtools/stream-data` để verify
3. Nếu vẫn không thấy → Cần dùng official Motia stream client

### Cron Step không chạy

**Check logs:**
```bash
cd app-backend
npm run dev
# Tìm log: "Refreshing RPC metrics from ClickHouse"
```

**Manual trigger:**
```bash
curl -X POST http://localhost:3001/devtools/test-stream-update
```

### Stream có data nhưng WebSocket không nhận

- **Motia streams cần official client** để subscribe
- **Plain WebSocket** chỉ connect được, không subscribe được
- **Dùng `@motiadev/stream-client-react`** hoặc test trên Workbench

