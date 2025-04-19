import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, User, ArrowRight } from "lucide-react"

export default function BlogPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Sloth Planner Blog</h1>
        <p className="text-lg text-muted-foreground mb-8">Insights, tips, and updates for better productivity</p>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              className="pl-10" 
              placeholder="Search articles" 
            />
          </div>
        </div>
        
        {/* Featured Post */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
          <div className="grid md:grid-cols-2">
            <div className="bg-gray-200 min-h-[300px] md:min-h-full"></div>
            <div className="p-6 md:p-8">
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="mr-4">May 15, 2023</span>
                <User className="h-4 w-4 mr-1" />
                <span>Tanooj Vardhan</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Introducing Sloth Planner: Your AI-Powered Productivity Partner</h2>
              <p className="text-gray-600 mb-6">
                Today, we're excited to unveil Sloth Planner—a revolutionary approach to personal and professional planning. 
                Learn how our AI-powered assistant can transform your productivity while reducing stress.
              </p>
              <Button variant="outline" className="flex items-center">
                Read Article
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Recent Articles */}
        <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Article 1 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 h-48"></div>
            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>May 10, 2023</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>5 min read</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">5 Ways to Master Time Blocking for Maximum Focus</h3>
              <p className="text-gray-600 mb-4">
                Time blocking is more than just scheduling—it's an intentional approach to making the most of your day. 
                Learn how to implement this powerful technique.
              </p>
              <Button variant="ghost" className="flex items-center p-0 h-auto">
                Read more
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Article 2 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 h-48"></div>
            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>May 5, 2023</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>7 min read</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">The Science of Goal Setting: Why Most People Fail and How to Succeed</h3>
              <p className="text-gray-600 mb-4">
                Discover the psychological principles behind effective goal setting and learn practical strategies for 
                turning your ambitions into achievements.
              </p>
              <Button variant="ghost" className="flex items-center p-0 h-auto">
                Read more
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Article 3 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 h-48"></div>
            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Apr 28, 2023</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>4 min read</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">How AI is Revolutionizing Personal Planning and Organization</h3>
              <p className="text-gray-600 mb-4">
                Artificial intelligence is changing how we approach productivity. Learn how AI assistants like 
                Sloth Planner are creating personalized planning experiences.
              </p>
              <Button variant="ghost" className="flex items-center p-0 h-auto">
                Read more
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-12">
          <a href="#" className="bg-white p-4 rounded-lg shadow-md text-center hover:bg-primary/5 transition-colors">
            <h3 className="font-medium mb-1">Productivity Tips</h3>
            <p className="text-sm text-muted-foreground">24 articles</p>
          </a>
          <a href="#" className="bg-white p-4 rounded-lg shadow-md text-center hover:bg-primary/5 transition-colors">
            <h3 className="font-medium mb-1">Time Management</h3>
            <p className="text-sm text-muted-foreground">18 articles</p>
          </a>
          <a href="#" className="bg-white p-4 rounded-lg shadow-md text-center hover:bg-primary/5 transition-colors">
            <h3 className="font-medium mb-1">Goal Setting</h3>
            <p className="text-sm text-muted-foreground">15 articles</p>
          </a>
          <a href="#" className="bg-white p-4 rounded-lg shadow-md text-center hover:bg-primary/5 transition-colors">
            <h3 className="font-medium mb-1">AI & Productivity</h3>
            <p className="text-sm text-muted-foreground">12 articles</p>
          </a>
        </div>
        
        {/* Newsletter */}
        <div className="bg-primary/10 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get the latest productivity tips, app updates, and exclusive content delivered to your inbox.
          </p>
          <div className="flex max-w-md mx-auto">
            <Input placeholder="Your email address" className="rounded-r-none" />
            <Button className="rounded-l-none">Subscribe</Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}