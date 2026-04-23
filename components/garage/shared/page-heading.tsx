type PageHeadingProps = {
  title: string
  description: string
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-brand-muted">{description}</p>
    </div>
  )
}
