import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

export function Testimonials() {
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Product Manager",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "Sloth has completely transformed how I manage my team's projects. The AI suggestions are spot on and save me hours every week.",
      initials: "AJ",
    },
    {
      name: "Sarah Chen",
      role: "Freelance Designer",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "As a freelancer juggling multiple clients, Sloth helps me stay organized and never miss a deadline. The interface is beautiful and intuitive.",
      initials: "SC",
    },
    {
      name: "Michael Rodriguez",
      role: "Software Engineer",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "The goal tracking feature has helped me stay focused on what matters. I've accomplished more in the last month than in the previous three.",
      initials: "MR",
    },
  ]

  return (
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm">
          <span className="text-slate-600">Testimonials</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Loved by Productive People</h2>
          <p className="max-w-[900px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            See what our users have to say about how Sloth has transformed their productivity
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    {Array(5)
                      .fill(null)
                      .map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5 text-yellow-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                  </div>
                  <p className="text-slate-600">{testimonial.content}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
