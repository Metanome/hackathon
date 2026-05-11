import { APP_NAME } from '../constants'

export default function Footer() {
  return (
    <footer className="md:ml-0 border-t border-slate-800 bg-slate-900/30 px-4 sm:px-8 py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-teal-500 font-semibold">{APP_NAME}</span>
          <span>·</span>
          <span>YZTA 5.0 Hackathon</span>
          <span>·</span>
          <span>{new Date().getFullYear()}</span>
        </div>
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-500 hover:text-teal-300 transition-colors font-medium"
        >
          API Reference →
        </a>
      </div>
    </footer>
  )
}
