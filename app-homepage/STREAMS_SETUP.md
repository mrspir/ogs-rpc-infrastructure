# Motia Streams Setup Guide

## Cách hoạt động

### 1. Backend (Motia)
- **HTTP API**: `http://localhost:3001/metrics/overview` - Dùng cho SSR/initial load
- **WebSocket**: `ws://localhost:3001` - Real-time updates qua streams
- **Cron Step**: Chạy mỗi 5 giây, query ClickHouse và push vào streams

### 2. Frontend (Next.js)
- **SSR**: Fetch từ HTTP API để có initial data
- **Client-side**: Kết nối WebSocket để nhận real-time updates
- **No polling**: WebSocket tự động push updates khi có data mới

## Setup Steps

### 1. Install package

```bash
cd app-homepage
npm install @motiadev/stream-client-react
```

### 2. Wrap app với MotiaStreamProvider

Update `app/layout.tsx`:

```tsx
import { MotiaStreamProvider } from '@motiadev/stream-client-react'

export default function RootLayout({ children }) {
  const wsUrl = process.env.NEXT_PUBLIC_MOTIA_WS_URL || 'ws://localhost:3001'
  
  return (
    <html>
      <body>
        <MotiaStreamProvider address={wsUrl}>
          {children}
        </MotiaStreamProvider>
      </body>
    </html>
  )
}
```

### 3. Add environment variable

Create/update `.env.local`:

```
NEXT_PUBLIC_MOTIA_WS_URL=ws://localhost:3001
```

**Lưu ý**: 
- WebSocket URL phải là `ws://` (không phải `http://`)
- Port phải match với Motia backend (thường là 3001)
- Nếu deploy production, đổi thành `wss://` (secure WebSocket)

### 4. Use stream component

Thay thế `GlobalMetricsClient` (polling) bằng `GlobalMetricsStream`:

```tsx
import { GlobalMetricsStream } from './components/global-metrics-stream'

export async function GlobalMetrics() {
  const baseUrl = 'http://localhost:3001'
  const wsUrl = process.env.NEXT_PUBLIC_MOTIA_WS_URL || 'ws://localhost:3001'
  
  // SSR: Fetch initial data
  const overview = await fetch(`${baseUrl}/metrics/overview`).then(r => r.json())
  
  return (
    <GlobalMetricsStream 
      wsUrl={wsUrl}
      initialData={overview}
    />
  )
}
```

## How it works

1. **Initial Load (SSR)**:
   - Next.js fetch từ `http://localhost:3001/metrics/overview`
   - Render với initial data

2. **Client-side (Hydration)**:
   - `MotiaStreamProvider` kết nối WebSocket tới `ws://localhost:3001`
   - `useStream()` subscribe vào `metricsOverview` stream, groupId="global", id="global"

3. **Real-time Updates**:
   - Cron Step chạy mỗi 5s, query ClickHouse
   - Push data vào stream: `streams.metricsOverview.set("global", "global", data)`
   - WebSocket tự động push update xuống tất cả clients đang subscribe
   - React component tự động re-render với data mới

4. **No Polling**:
   - Không cần `setInterval` hay `useEffect` với polling
   - WebSocket connection handle mọi thứ
   - Chỉ update khi có data mới (efficient)

## Troubleshooting

### WebSocket không connect
- Check Motia backend đang chạy: `cd app-backend && npm run dev`
- Check port: WebSocket URL phải match với HTTP API port
- Check browser console: Xem có WebSocket connection errors không

### Không nhận được updates
- Check Cron Step có chạy không: Xem logs trong Motia backend
- Check stream đã được register: `npm run generate-types` trong app-backend
- Check stream data: Gọi `GET /metrics/overview` xem có data không

### Production deployment
- WebSocket URL phải là `wss://` (secure)
- Cần reverse proxy (nginx/traefik) để handle WebSocket upgrade
- Check CORS settings nếu frontend/backend ở domain khác nhau

