import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { getTodaysVisits } from '@/services/patientService'

export default function WaitingScreen() {
  const [nowServing, setNowServing]   = useState(null)
  const [nextQueue, setNextQueue]     = useState(null)
  const [waiting, setWaiting]         = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = async () => {
    const visits = await getTodaysVisits()
    const inConsultation = visits.find((v) => v.status === 'in_consultation')
    const waitingList    = visits.filter((v) => v.status === 'waiting')
    setNowServing(inConsultation?.queue_no || null)
    setNextQueue(waitingList[0]?.queue_no || null)
    setWaiting(waitingList)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-primary-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-primary-800">
        <div>
          <p className="text-primary-300 text-sm">Kyambogo University</p>
          <p className="text-xl font-bold">Medical Center — Waiting Room</p>
        </div>
        <div className="text-right text-xs text-primary-400">
          {lastUpdated && (
            <p>Updated {lastUpdated.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}</p>
          )}
          <button
            onClick={load}
            className="mt-1 flex items-center gap-1 text-primary-400 hover:text-primary-200 ml-auto"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </header>

      {/* Main display */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Now serving */}
          <div className="bg-primary-800 rounded-3xl p-8 text-center border-2 border-primary-600">
            <p className="text-primary-300 text-sm font-medium uppercase tracking-widest mb-3">
              Now Serving
            </p>
            {nowServing ? (
              <p className="text-8xl font-extrabold text-white leading-none">{nowServing}</p>
            ) : (
              <p className="text-6xl font-bold text-primary-500">—</p>
            )}
            <p className="mt-3 text-primary-400 text-sm">Doctor's Room</p>
          </div>

          {/* Next in queue */}
          <div className="bg-primary-800 rounded-3xl p-8 text-center">
            <p className="text-primary-300 text-sm font-medium uppercase tracking-widest mb-3">
              Next in Queue
            </p>
            {nextQueue ? (
              <p className="text-8xl font-extrabold text-primary-300 leading-none">{nextQueue}</p>
            ) : (
              <p className="text-6xl font-bold text-primary-600">—</p>
            )}
            <p className="mt-3 text-primary-400 text-sm">Please wait in lobby</p>
          </div>
        </div>

        {/* Waiting list */}
        {waiting.length > 0 && (
          <div className="mt-10 w-full max-w-3xl">
            <p className="text-primary-400 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
              Also Waiting ({waiting.length})
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {waiting.map((v) => (
                <span
                  key={v.id}
                  className="font-mono font-bold text-sm bg-primary-800 text-primary-300 px-4 py-2 rounded-xl"
                >
                  {v.queue_no}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-primary-600 py-4">
        Queue numbers are assigned at Reception · Auto-refreshes every 30 seconds
      </footer>
    </div>
  )
}
