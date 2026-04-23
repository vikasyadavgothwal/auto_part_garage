import { Star } from "lucide-react"

type ReviewStarsProps = {
  rating: number
}

export function ReviewStars({ rating }: ReviewStarsProps) {
  return (
    <div
      aria-label={`${rating} star rating`}
      className="flex items-center gap-1"
    >
      {Array.from({ length: rating }).map((_, index) => (
        <Star
          aria-hidden="true"
          key={index}
          className="h-4 w-4 fill-primary text-primary"
        />
      ))}
    </div>
  )
}
