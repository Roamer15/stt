import { Link, Route, Routes } from "react-router-dom";
import Display from "./Display";
import Speak from "./Speak";

function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900 antialiased">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div >
          <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10 lg:pt-8">
            <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Clear communication for every classroom
                </p>

                <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.08em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Make every word easy to follow.
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  Transform live classroom speech into clear, readable captions
                  for students, teachers, and audiences in real time.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/display"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-medium text-white transition duration-200 ease-out hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Open display view
                  </Link>
                  <Link
                    to="/speak"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-900 transition duration-200 ease-out hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Start speaking
                  </Link>
                </div>

                <ul id="features" className="mt-9 grid gap-3 sm:grid-cols-3">
                  {[
                    "Live transcript",
                    "Teacher microphone",
                    "WCAG-friendly output",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ready to start
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        Choose your role
                      </p>
                    </div>
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Link
                      to="/display"
                      className="group block rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Display
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                        TV / computer
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Large readable caption view
                      </div>
                    </Link>

                    <Link
                      to="/speak"
                      className="group block rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Teacher
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                        Phone mic
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Start captioning instantly
                      </div>
                    </Link>
                  </div>

                  <div
                    id="accessibility"
                    className="mt-5 rounded-2xl border border-slate-200 bg-slate-100 p-3"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Accessibility
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-700">
                      High-contrast text, keyboard focus states, and readable
                      layouts designed for easy use.
                    </div>
                  </div>
                </div>
              </aside>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/display" element={<Display />} />
      <Route path="/speak" element={<Speak />} />
    </Routes>
  );
}
