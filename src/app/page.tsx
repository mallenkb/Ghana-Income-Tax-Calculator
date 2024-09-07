import { JetBrains_Mono } from 'next/font/google'
import Widget from '../components/Widget'

// Load JetBrains Mono font
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export default function Home() {
  return (
    <main className={`min-h-screen bg-[#F7F7F7] flex flex-col items-center p-4 ${jetbrainsMono.className}`}>
      <div className="w-full max-w-[560px] mt-0 sm:mt-6">
        <Widget />
      </div>
    </main>
  )
}