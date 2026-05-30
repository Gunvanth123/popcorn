import { useState, useEffect, useRef } from 'react'

export default function LazyRow({ children, height = '345px', className = '' }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    // Native IntersectionObserver to check if row is near viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Stop observing once it's visible
        }
      },
      {
        rootMargin: '200px 0px', // Load 200px before coming into view
        threshold: 0.01,
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={className} style={{ minHeight: isVisible ? 'auto' : height }}>
      {isVisible ? children : (
        <div className="w-full h-full flex flex-col gap-4 animate-pulse py-4">
          {/* Skeleton row title */}
          <div className="h-5 w-48 bg-slate-800/60 rounded-lg"></div>
          {/* Skeleton carousel row cards */}
          <div className="flex gap-6 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="min-w-[165px] w-[165px] sm:min-w-[190px] sm:w-[190px] aspect-[2/3] bg-slate-900/40 border border-slate-800/50 rounded-2xl shrink-0"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
