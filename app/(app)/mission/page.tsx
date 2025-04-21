import { SiteFooter } from "@/components/site-footer"

export default function MissionPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Mission</h1>
        
        <div className="prose max-w-none">
          <section className="mb-12">
            <div className="bg-primary/10 p-8 rounded-xl mb-8">
              <p className="text-2xl font-semibold text-center italic">
                "To empower individuals and teams to manage their time with intention, 
                reducing stress and creating space for what truly matters."
              </p>
            </div>
            
            <p className="text-xl mb-6">
              At Sloth Planner, we're transforming how people plan and organize their lives.
            </p>
            
            <p className="mb-4">
              In today's fast-paced world, most people feel overwhelmed by endless tasks and commitments.
              Traditional planning tools often add to this burden rather than alleviating it, with complicated
              interfaces and inflexible systems that don't adapt to individual needs.
            </p>
            
            <p className="mb-4">
              We believe that technology should work for you, not against you. That's why we've created
              an AI-powered planning assistant that understands your unique patterns, priorities, and preferences.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Core Objectives</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Simplify Planning</h3>
                <p>
                  We're removing the complexity from time management. Our intuitive interface and AI assistance
                  make planning your day, week, or month straightforward and even enjoyable.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Personalize Organization</h3>
                <p>
                  No two people work the same way. Our system learns your habits, adapts to your workflow,
                  and offers personalized suggestions to help you be more productive in a way that feels natural to you.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Encourage Mindfulness</h3>
                <p>
                  Like our sloth mascot, we promote deliberate, intentional living. We help you prioritize what's important,
                  reduce distractions, and create space for reflection and rest.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Foster Achievement</h3>
                <p>
                  We believe in celebrating progress, not just checking boxes. Our goal tracking and visualization tools
                  help you see how far you've come and stay motivated on your journey.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Why It Matters</h2>
            
            <p className="mb-4">
              Time is our most valuable, non-renewable resource. How we spend our days is ultimately how we spend our lives.
              Yet many of us struggle with managing our time effectively, leading to stress, burnout, and missed opportunities.
            </p>
            
            <p className="mb-4">
              By creating tools that make time management more intuitive and personalized, we're not just building software—we're
              helping people reclaim control of their time and, by extension, their lives.
            </p>
            
            <p className="mb-4">
              When people can plan effectively, they reduce stress, increase productivity, and create more space for creativity,
              connection, and the activities that bring them joy.
            </p>
          </section>
          
          <section>
            <h2 className="text-3xl font-bold mb-6">Join Us on This Journey</h2>
            
            <p className="mb-4">
              Our mission is ambitious, but we're just getting started. As we continue to develop and refine our platform,
              we invite you to join us. Your feedback, ideas, and experiences help shape the future of Sloth Planner.
            </p>
            
            <p className="mb-4">
              Together, we can create a world where technology supports our human needs—where planning is simple,
              personalized, and helps us live with greater intention and fulfillment.
            </p>
            
            <div className="mt-8">
              <a href="/signup" className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
                Start Planning With Purpose
              </a>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}