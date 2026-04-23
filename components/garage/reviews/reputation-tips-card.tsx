import { Card, CardContent } from "@/components/ui/card"

type ReputationTipsCardProps = {
  tips: string[]
}

export function ReputationTipsCard({ tips }: ReputationTipsCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-2 font-semibold text-foreground">
          Building Your Reputation
        </h3>

        <ul className="space-y-2 text-sm text-brand-muted">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
