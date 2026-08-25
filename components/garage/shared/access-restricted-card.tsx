import { Card, CardContent } from "@/components/ui/card"

export function AccessRestrictedCard({
  title = "Access restricted",
  message = "You do not have permission to view this section.",
}: {
  title?: string
  message?: string | null
}) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-200">
        <p className="font-semibold">{title}</p>
        <p className="mt-1">{message}</p>
      </CardContent>
    </Card>
  )
}
