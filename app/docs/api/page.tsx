import { SiteFooter } from "@/components/site-footer"

export default function APIDocumentationPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">API Documentation</h1>
        <div className="prose max-w-none">
          <p className="text-xl mb-6">
            Integrate your applications with Sloth Planner using our RESTful API.
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <p>
                To use the Sloth Planner API, you'll need an API key. You can generate one in your 
                account settings under the API section.
              </p>
              <div className="my-4 p-4 bg-gray-100 rounded-md">
                <p className="font-mono">BASE URL: https://api.slothplanner.com/v1</p>
              </div>
              <p>
                All requests must include your API key in the Authorization header:
              </p>
              <div className="my-4 p-4 bg-gray-100 rounded-md font-mono">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Tasks API</h2>
              
              <div className="border rounded-md overflow-hidden mb-6">
                <div className="bg-green-100 p-3 border-b">
                  <span className="font-semibold text-green-700">GET</span> /tasks
                </div>
                <div className="p-4">
                  <p className="mb-2">Returns a list of all tasks for the authenticated user.</p>
                  <h4 className="font-semibold mt-4 mb-2">Query Parameters:</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li><code>completed</code> (boolean): Filter by completion status</li>
                    <li><code>priority</code> (string): Filter by priority level (high, medium, low)</li>
                    <li><code>due_before</code> (ISO date): Filter tasks due before date</li>
                    <li><code>due_after</code> (ISO date): Filter tasks due after date</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-2">Example Response:</h4>
                  <pre className="bg-gray-100 p-2 rounded-md overflow-auto">
{`{
  "tasks": [
    {
      "id": "task-123456",
      "title": "Finish project proposal",
      "description": "Complete draft and send for review",
      "completed": false,
      "priority": "high",
      "due_date": "2023-12-15T10:00:00Z",
      "tags": ["work", "project"]
    },
    ...
  ],
  "total": 24,
  "page": 1,
  "per_page": 20
}`}
                  </pre>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden mb-6">
                <div className="bg-blue-100 p-3 border-b">
                  <span className="font-semibold text-blue-700">POST</span> /tasks
                </div>
                <div className="p-4">
                  <p className="mb-2">Creates a new task.</p>
                  
                  <h4 className="font-semibold mt-4 mb-2">Request Body:</h4>
                  <pre className="bg-gray-100 p-2 rounded-md overflow-auto">
{`{
  "title": "Finish project proposal",
  "description": "Complete draft and send for review",
  "priority": "high",
  "due_date": "2023-12-15T10:00:00Z",
  "tags": ["work", "project"]
}`}
                  </pre>
                  
                  <h4 className="font-semibold mt-4 mb-2">Example Response:</h4>
                  <pre className="bg-gray-100 p-2 rounded-md overflow-auto">
{`{
  "id": "task-123456",
  "title": "Finish project proposal",
  "description": "Complete draft and send for review",
  "completed": false,
  "priority": "high",
  "due_date": "2023-12-15T10:00:00Z",
  "tags": ["work", "project"],
  "created_at": "2023-12-01T15:23:42Z"
}`}
                  </pre>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Calendar API</h2>
              
              <div className="border rounded-md overflow-hidden mb-6">
                <div className="bg-green-100 p-3 border-b">
                  <span className="font-semibold text-green-700">GET</span> /events
                </div>
                <div className="p-4">
                  <p className="mb-2">Returns a list of all calendar events for the authenticated user.</p>
                  <h4 className="font-semibold mt-4 mb-2">Query Parameters:</h4>
                  <ul className="list-disc pl-5 mb-4">
                    <li><code>start_date</code> (ISO date): Filter events starting after date</li>
                    <li><code>end_date</code> (ISO date): Filter events ending before date</li>
                    <li><code>calendar_id</code> (string): Filter by specific calendar</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden mb-6">
                <div className="bg-blue-100 p-3 border-b">
                  <span className="font-semibold text-blue-700">POST</span> /events
                </div>
                <div className="p-4">
                  <p className="mb-2">Creates a new calendar event.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Rate Limits</h2>
              <p>
                The API is rate limited to 100 requests per minute per API key. If you exceed this limit,
                you'll receive a 429 Too Many Requests response.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Response Headers</h3>
              <p>Each response includes the following headers to help you track your rate limit usage:</p>
              <ul className="list-disc pl-5">
                <li><code>X-RateLimit-Limit</code>: Maximum number of requests allowed per minute</li>
                <li><code>X-RateLimit-Remaining</code>: Number of requests remaining in the current window</li>
                <li><code>X-RateLimit-Reset</code>: Time when the rate limit resets (Unix timestamp)</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}