export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">About Sloth Planner</h1>
        
        <div className="prose max-w-none">
          <section className="mb-12">
            <p className="text-xl mb-6">
              We're on a mission to make personal and professional planning effortless through the power of AI.
            </p>
            
            <p className="mb-4">
              Sloth Planner was founded in 2023 by a team of productivity enthusiasts who were frustrated with existing planning tools. 
              We believe that planning shouldn't be stressful or time-consuming - it should be intuitive and even enjoyable.
            </p>
            
            <p className="mb-4">
              Our mascot, the sloth, represents our philosophy: move deliberately and mindfully, focusing on what truly matters. 
              We want our users to work smarter, not harder, and to have more time for the things they love.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Team</h2>
            
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
                <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-center">Tanooj Vardhan</h3>
                <p className="text-center text-muted-foreground mb-2">Founder & CEO</p>
                <p className="text-sm text-center">
                  Visionary entrepreneur with a passion for productivity tools and AI. 
                  Sole creator of Sloth Planner, bringing together technology and productivity 
                  to help people manage their time more effectively.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
                <p>
                  We believe in keeping things simple and focused. Our interface is clean and 
                  intuitive, eliminating distractions and helping you concentrate on what matters.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p>
                  We're constantly exploring new technologies and approaches to make planning 
                  more effective and enjoyable. Our AI assistant is just the beginning.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
                <p>
                  We believe productivity tools should be available to everyone, regardless of 
                  financial means or abilities. We're committed to keeping our core features free 
                  and ensuring our platform is accessible to all users.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Privacy</h3>
                <p>
                  Your data is yours. We're committed to the highest standards of data security 
                  and privacy, and we will never sell or misuse your personal information.
                </p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
            <p className="mb-4">
              We're just getting started, and we'd love for you to join us on this journey. Sign up for 
              Sloth Planner today and experience the future of intelligent planning.
            </p>
            <p>
              Have questions or feedback? We'd love to hear from you! Reach out to us at 
              <a href="mailto:tanooj@slothplanner.com" className="text-primary ml-1">tanooj@slothplanner.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}