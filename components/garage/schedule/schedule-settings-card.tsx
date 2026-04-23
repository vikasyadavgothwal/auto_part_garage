import { Card, CardContent } from "@/components/ui/card"

const scheduleSettings = [
  {
    title: "Operating Hours",
    description: "Set your daily working hours",
  },
  {
    title: "Service Duration",
    description: "Configure default time slots",
  },
]

export function ScheduleSettingsCard() {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold text-foreground">
          Schedule Settings
        </h3>

        <div className="space-y-3">
          {scheduleSettings.map((item) => (
            <button
              key={item.title}
              type="button"
              className="w-full rounded-lg bg-background p-3 text-left transition-all hover:border hover:border-primary"
            >
              <div className="mb-1 font-medium text-foreground">
                {item.title}
              </div>
              <div className="text-sm text-brand-muted">
                {item.description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
