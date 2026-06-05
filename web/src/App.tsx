import { useEffect, useState } from 'react'

// สถานะการเชื่อมต่อ API: กำลังเช็ค / เชื่อมได้ / เชื่อมไม่ได้
type Health = { status: string; database: string }

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // เรียกผ่าน proxy ของ Vite → ส่งต่อไป Rust API
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Health) => setHealth(data))
      .catch((err) => setError(String(err)))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">GMT Solar</h1>
        <p className="mt-1 text-slate-500">ระบบหลังบ้านคำนวณต้นทุน</p>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-600">สถานะการเชื่อมต่อ API</p>
          {!health && !error && (
            <p className="mt-2 text-slate-400">กำลังตรวจสอบ…</p>
          )}
          {health && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              เชื่อมต่อสำเร็จ · ฐานข้อมูล {health.database}
            </p>
          )}
          {error && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              เชื่อมต่อไม่ได้: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
