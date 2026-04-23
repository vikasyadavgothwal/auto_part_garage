import { Card, CardContent } from "@/components/ui/card"

type ServiceManagementTipsCardProps = {
  tips: string[]
}

export function ServiceManagementTipsCard({
  tips,
}: ServiceManagementTipsCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-2 font-semibold text-foreground">
          Service Management Tips
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
